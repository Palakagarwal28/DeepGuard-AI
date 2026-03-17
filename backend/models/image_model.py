import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import numpy as np
import cv2
import base64
import os

# Define the Image classification model
class DeepfakeImageDetector(nn.Module):
    def __init__(self, model_name='resnet50', pretrained=True):
        super(DeepfakeImageDetector, self).__init__()
        
        self.model_name = model_name
        
        # Variables to store gradients and activations for Grad-CAM
        self.gradients = None
        self.activations = None
        
        if model_name == 'resnet50':
            # Load pretrained ResNet50
            weights = models.ResNet50_Weights.DEFAULT if pretrained else None
            self.base_model = models.resnet50(weights=weights)
            
            # Hook the final convolutional layer directly
            self.target_layer = self.base_model.layer4[2].conv3
            
            # Replace final fully connected layer for binary classification (Real: 0, Fake: 1)
            num_ftrs = self.base_model.fc.in_features
            self.base_model.fc = nn.Sequential(
                nn.Dropout(0.5),
                nn.Linear(num_ftrs, 1)
            )
            
        elif model_name == 'efficientnet_b0':
            weights = models.EfficientNet_B0_Weights.DEFAULT if pretrained else None
            self.base_model = models.efficientnet_b0(weights=weights)
            
            # Hook final convolutional feature block in EfficientNet
            self.target_layer = self.base_model.features[-1]
            
            num_ftrs = self.base_model.classifier[1].in_features
            self.base_model.classifier[1] = nn.Sequential(
                nn.Dropout(0.5),
                nn.Linear(num_ftrs, 1)
            )
        else:
            raise ValueError("Unsupported model_name. Choose 'resnet50' or 'efficientnet_b0'.")
            
        # Register hooks for Grad-CAM
        self.target_layer.register_forward_hook(self.save_activation)
        self.target_layer.register_full_backward_hook(self.save_gradient)

    def save_activation(self, module, input, output):
        self.activations = output

    def save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]

    def forward(self, x):
        return self.base_model(x)

def get_transform():
    return transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        ),
    ])

def generate_gradcam_heatmap(model, original_image, input_tensor):
    """
    Computes the Grad-CAM representation and overlays it on the original image.
    Returns: base64 encoded JPG string.
    """
    try:
        # Get pooled gradients across the spatial dimensions
        pooled_gradients = torch.mean(model.gradients, dim=[0, 2, 3])
        activations = model.activations.detach()[0]
        
        # Weight the channels by corresponding gradients
        for i in range(activations.size(0)):
            activations[i, :, :] *= pooled_gradients[i]
            
        # Average the channels of the activations
        heatmap = torch.mean(activations, dim=0).squeeze().cpu().numpy()
        
        # ReLU on top of the heatmap (discard negative influence)
        heatmap = np.maximum(heatmap, 0)
        
        # Normalize the heatmap between [0, 1]
        heatmap /= (np.max(heatmap) + 1e-8)
        
        # Resize heatmap to match original image using OpenCV
        original_cv = cv2.cvtColor(np.array(original_image), cv2.COLOR_RGB2BGR)
        heatmap = cv2.resize(heatmap, (original_cv.shape[1], original_cv.shape[0]))
        
        # Convert to 8-bit unsigned integer [0, 255]
        heatmap = np.uint8(255 * heatmap)
        
        # Apply the colormap (JET)
        heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
        
        # Superimpose the heatmap (0.4 alpha) on the original image
        superimposed_img = cv2.addWeighted(original_cv, 0.6, heatmap, 0.4, 0)
        
        # Encode as base64 JPEG
        _, buffer = cv2.imencode('.jpg', superimposed_img)
        img_b64 = base64.b64encode(buffer).decode('utf-8')
        
        return f"data:image/jpeg;base64,{img_b64}"
        
    except Exception as e:
        print(f"Grad-CAM generation failed: {e}")
        return None

def predict_image(image_path: str, model: DeepfakeImageDetector, device: str = 'cpu') -> dict:
    """
    Runs inference on an image and computes a Grad-CAM heatmap explainability map.
    """
    # 1. Load image
    try:
        image = Image.open(image_path).convert('RGB')
    except Exception as e:
        return {"error": f"Failed to load image: {e}"}

    # 2. Preprocess
    transform = get_transform()
    input_tensor = transform(image).unsqueeze(0).to(device)

    # Enable gradients specifically for input to compute Grad-CAM
    # Normally we do no_grad() for inference, but backwards() is needed for CAM
    model.eval()
    
    # We must explicitly require gradients on the input hooks will fire during .backward()
    model.zero_grad()
    outputs = model(input_tensor)
    
    # Calculate probability
    probability_fake = torch.sigmoid(outputs).item()
    
    is_fake = probability_fake > 0.5
    label = "Fake" if is_fake else "Real"
    confidence = probability_fake if is_fake else (1 - probability_fake)
    
    # Explainability: Grad-CAM
    # We backward pass through the output logit corresponding to our prediction
    # Since our output is a single logit representing 'Fake', we backward it directly
    outputs.backward()
    
    heatmap_b64 = generate_gradcam_heatmap(model, image, input_tensor)

    return {
        "label": label,
        "confidence": confidence,
        "probability_fake": probability_fake,
        "heatmap": heatmap_b64
    }

def load_model(weights_path: str = None, model_name='resnet50', device='cpu') -> nn.Module:
    model = DeepfakeImageDetector(model_name=model_name, pretrained=True)
    if weights_path and os.path.exists(weights_path):
        state_dict = torch.load(weights_path, map_location=device)
        model.load_state_dict(state_dict)
    
    model = model.to(device)
    model.eval()
    return model
    
if __name__ == "__main__":
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = load_model(weights_path=None, model_name='resnet50', device=device)
    
    test_image = "test_image.jpg"
    if not os.path.exists(test_image):
        img = Image.new('RGB', (300, 300), color = 'red')
        img.save(test_image)
        
    print(f"\nRunning inference on {test_image}...")
    result = predict_image(test_image, model, device=device)
    print(f"Result Label: {result['label']}")
    print("Heatmap generation:", "Success" if result['heatmap'] else "Failed")
    
    if os.path.exists(test_image):
        os.remove(test_image)
