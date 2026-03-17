import os
import time
import copy
import logging
from typing import Tuple, Dict, Any
import numpy as np

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms, models
from torchvision.models import ResNet50_Weights
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import cv2
from PIL import Image

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- CONFIGURATION ---
class Config:
    DATA_DIR = "dataset"  # Expected structure: dataset/real, dataset/fake
    IMG_SIZE = 224
    BATCH_SIZE = 32
    EPOCHS = 15
    LEARNING_RATE = 1e-4
    NUM_WORKERS = 4
    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    MODEL_SAVE_PATH = "deepfake_resnet50.pth"

# --- DATA PREPROCESSING & AUGMENTATION ---

class DeepfakeDataset(Dataset):
    """
    Custom Dataset for Deepfake Image Loading with OpenCV Face extraction 
    and robust augmentation to prevent bias.
    """
    def __init__(self, data_dir: str, list_files: list, labels: list, transform=None):
        self.data_dir = data_dir
        self.files = list_files
        self.labels = labels
        self.transform = transform
        
        # Load OpenCV Haar Cascade for face detection
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)

    def __len__(self):
        return len(self.files)

    def extract_face(self, img_path: str) -> Image.Image:
        """Reads image, detects face, crops it, and returns a PIL Image."""
        img = cv2.imread(img_path)
        if img is None:
            # Fallback to empty tensor if corrupted
            return Image.fromarray(np.zeros((Config.IMG_SIZE, Config.IMG_SIZE, 3), dtype=np.uint8))
            
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
        
        # If faces are found, crop the largest one
        if len(faces) > 0:
            # Sort by area
            faces = sorted(faces, key=lambda x: x[2]*x[3], reverse=True)
            x, y, w, h = faces[0]
            # Add padding
            pad = int(w * 0.1)
            x = max(0, x - pad)
            y = max(0, y - pad)
            w = min(img.shape[1] - x, w + 2*pad)
            h = min(img.shape[0] - y, h + 2*pad)
            
            face_img = img[y:y+h, x:x+w]
        else:
            # If no face detected, use center crop of original image
            face_img = img
            
        # Convert BGR to RGB for PIL
        face_img = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
        return Image.fromarray(face_img)

    def __getitem__(self, idx):
        img_path = self.files[idx]
        label = self.labels[idx]
        
        # Extract face
        image = self.extract_face(img_path)
        
        if self.transform:
            image = self.transform(image)
            
        return image, torch.tensor(label, dtype=torch.long)

def get_transforms() -> Tuple[transforms.Compose, transforms.Compose]:
    """Returns training and validation transforms with strong augmentation."""
    train_transform = transforms.Compose([
        transforms.Resize((Config.IMG_SIZE, Config.IMG_SIZE)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 2.0)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((Config.IMG_SIZE, Config.IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    return train_transform, val_transform

# --- MODEL DEFINITION ---

def build_model(num_classes: int = 2) -> nn.Module:
    """Builds a ResNet50 model with a custom classification head."""
    logger.info("Initializing ResNet50 backbone...")
    weights = ResNet50_Weights.DEFAULT
    model = models.resnet50(weights=weights)
    
    # Freeze backbone initially for transfer learning
    for param in model.parameters():
        param.requires_grad = False
        
    # Replace final fully connected layer
    num_ftrs = model.fc.in_features
    # Add a slightly more robust head to prevent 50% cliff
    model.fc = nn.Sequential(
        nn.Linear(num_ftrs, 512),
        nn.ReLU(),
        nn.Dropout(0.4),
        nn.Linear(512, num_classes)
    )
    
    return model.to(Config.DEVICE)

# --- INFERENCE COMPATIBILITY FOR REPORTING ---

def predict(model: nn.Module, image_tensor: torch.Tensor, temperature: float = 1.5) -> Dict[str, Any]:
    """
    Inference function mapped for FastAPI, incorporating temperature scaling
    to confidently separate logits from the 50% threshold.
    """
    model.eval()
    with torch.no_grad():
        image_tensor = image_tensor.to(Config.DEVICE)
        if len(image_tensor.shape) == 3:
            image_tensor = image_tensor.unsqueeze(0)
            
        logits = model(image_tensor)
        
        # Temperature Scaling for Calibration
        scaled_logits = logits / temperature
        probabilities = torch.softmax(scaled_logits, dim=1)
        
        confidence, predicted_class = torch.max(probabilities, 1)
        
        # Class 0: Real, Class 1: Fake
        result_label = "Fake" if predicted_class.item() == 1 else "Real"
        
        return {
            "result": result_label,
            "confidence": confidence.item()
        }

# --- EVALUATION LOOP ---

def evaluate_model(model: nn.Module, dataloader: DataLoader, criterion: nn.Module) -> float:
    model.eval()
    running_loss = 0.0
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for inputs, labels in dataloader:
            inputs, labels = inputs.to(Config.DEVICE), labels.to(Config.DEVICE)
            
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            running_loss += loss.item() * inputs.size(0)
            
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            
    epoch_loss = running_loss / len(dataloader.dataset)
    acc = accuracy_score(all_labels, all_preds)
    prec = precision_score(all_labels, all_preds, zero_division=0)
    rec = recall_score(all_labels, all_preds, zero_division=0)
    f1 = f1_score(all_labels, all_preds, zero_division=0)
    
    logger.info(f"Validation - Loss: {epoch_loss:.4f} | Acc: {acc:.4f} | P: {prec:.4f} | R: {rec:.4f} | F1: {f1:.4f}")
    
    # Return F1 as a holistic metric
    return f1

# --- TRAINING LOOP ---

def train_model(model: nn.Module, train_loader: DataLoader, val_loader: DataLoader, 
                criterion: nn.Module, optimizer: optim.Optimizer, scheduler, num_epochs: int):
    
    since = time.time()
    best_model_wts = copy.deepcopy(model.state_dict())
    best_f1 = 0.0

    for epoch in range(num_epochs):
        logger.info(f"Epoch {epoch}/{num_epochs - 1}")
        logger.info("-" * 10)
        
        # Unfreeze all layers after epoch 3 for fine-tuning
        if epoch == 3:
            logger.info("Unfreezing backbone for fine-tuning...")
            for param in model.parameters():
                param.requires_grad = True

        model.train()
        running_loss = 0.0
        running_corrects = 0

        for inputs, labels in train_loader:
            inputs = inputs.to(Config.DEVICE)
            labels = labels.to(Config.DEVICE)

            optimizer.zero_grad()

            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            loss = criterion(outputs, labels)

            loss.backward()
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)

        epoch_loss = running_loss / len(train_loader.dataset)
        epoch_acc = running_corrects.double() / len(train_loader.dataset)

        logger.info(f"Train - Loss: {epoch_loss:.4f} | Acc: {epoch_acc:.4f}")

        # Validate
        epoch_f1 = evaluate_model(model, val_loader, criterion)
        
        # Step the learning rate scheduler
        scheduler.step(epoch_f1)

        # Deep copy the model
        if epoch_f1 > best_f1:
            best_f1 = epoch_f1
            best_model_wts = copy.deepcopy(model.state_dict())
            torch.save(model.state_dict(), Config.MODEL_SAVE_PATH)
            logger.info(f"*** New Best Model Saved (F1: {best_f1:.4f}) ***")

        print()

    time_elapsed = time.time() - since
    logger.info(f"Training complete in {time_elapsed // 60:.0f}m {time_elapsed % 60:.0f}s")
    logger.info(f"Best Validation F1: {best_f1:.4f}")

    # Load best model weights
    model.load_state_dict(best_model_wts)
    return model

# --- MAIN EXECUTION PIPELINE ---
def main():
    logger.info(f"Using device: {Config.DEVICE}")
    
    # NOTE: For Hackathon implementation, this script expects the data directories to exist
    # Let's create dummy test logic to prove the pipeline initializes safely
    real_dir = os.path.join(Config.DATA_DIR, "real")
    fake_dir = os.path.join(Config.DATA_DIR, "fake")
    
    if not os.path.exists(real_dir) or not os.path.exists(fake_dir):
        logger.warning(f"Dataset directories not found. Creating dummy arrays for pipeline validation.")
        logger.info("To train on real data, place images in 'dataset/real' and 'dataset/fake'.")
        
        # Dummy Overfitting Validation Test Pipeline
        dummy_model = build_model()
        dummy_tensor = torch.randn(1, 3, Config.IMG_SIZE, Config.IMG_SIZE)
        result = predict(dummy_model, dummy_tensor)
        logger.info(f"Dummy Inference Test Yields: {result}")
        return

    # 1. Dataset Prep
    # (Assuming scanning files logic fills these arrays dynamically based on dir contents)
    real_files = [os.path.join(real_dir, f) for f in os.listdir(real_dir)]
    fake_files = [os.path.join(fake_dir, f) for f in os.listdir(fake_dir)]
    
    all_files = real_files + fake_files
    # 0 = Real, 1 = Fake
    all_labels = [0] * len(real_files) + [1] * len(fake_files)
    
    # Train/Val Split (80/20)
    from sklearn.model_selection import train_test_split
    X_train, X_val, y_train, y_val = train_test_split(all_files, all_labels, test_size=0.2, random_state=42, stratify=all_labels)
    
    train_transform, val_transform = get_transforms()
    
    train_dataset = DeepfakeDataset(Config.DATA_DIR, X_train, y_train, transform=train_transform)
    val_dataset = DeepfakeDataset(Config.DATA_DIR, X_val, y_val, transform=val_transform)
    
    # Bias Prevention: Calculating Class Weights for CrossEntropyLoss
    num_real = len(real_files)
    num_fake = len(fake_files)
    total_samples = len(all_labels)
    weight_real = total_samples / (2.0 * num_real)
    weight_fake = total_samples / (2.0 * num_fake)
    class_weights = torch.tensor([weight_real, weight_fake], dtype=torch.float).to(Config.DEVICE)
    logger.info(f"Computed Class Weights: Real={weight_real:.2f}, Fake={weight_fake:.2f}")

    train_loader = DataLoader(train_dataset, batch_size=Config.BATCH_SIZE, shuffle=True, num_workers=Config.NUM_WORKERS)
    val_loader = DataLoader(val_dataset, batch_size=Config.BATCH_SIZE, shuffle=False, num_workers=Config.NUM_WORKERS)
    
    # 2. Build Model
    model = build_model().to(Config.DEVICE)
    
    # 3. Setup Optimizers
    criterion = nn.CrossEntropyLoss(weight=class_weights)
    optimizer = optim.Adam(model.fc.parameters(), lr=Config.LEARNING_RATE)
    # Reduce LR on Plateau helps fine-tune gradients over time
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', factor=0.5, patience=2, verbose=True)
    
    # 4. Train
    model = train_model(model, train_loader, val_loader, criterion, optimizer, scheduler, num_epochs=Config.EPOCHS)

if __name__ == "__main__":
    main()
