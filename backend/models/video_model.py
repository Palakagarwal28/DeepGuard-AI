import cv2
import torch
from PIL import Image
import numpy as np

# We import the required preprocessing transformation from the image model
from models.image_model import get_transform

def predict_video(video_path: str, model: torch.nn.Module, device: str = 'cpu', frames_per_second: int = 1) -> dict:
    """
    Extracts frames from a video, runs them through the image deepfake model, 
    and aggregates the predictions.
    
    Args:
        video_path: Path to the video file.
        model: The trained PyTorch DeepfakeImageDetector model.
        device: 'cpu' or 'cuda'.
        frames_per_second: Extract 1 frame every N seconds to save computation.
        
    Returns:
        dict: The aggregated result, confidence, and number of frames analyzed.
    """
    
    # Open the video using OpenCV
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"error": "Failed to open video file."}

    fps = cap.get(cv2.CAP_PROP_FPS)

    # Frame interval calculation: e.g., if fps=30 and we want 1 frame per second, interval=30
    frame_interval = int(fps / frames_per_second) if fps > 0 else 30
    
    frame_count = 0
    extracted_frames = 0
    total_probability_fake = 0.0
    
    transform = get_transform()
    model = model.to(device)
    model.eval()

    # Disable gradients for entire video inference
    with torch.no_grad():
        while True:
            ret, frame = cap.read()
            if not ret:
                break # End of video
            
            # Extract frame periodically based on interval
            if frame_count % frame_interval == 0:
                # Convert OpenCV BGR format to RGB
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                # Convert to PIL Image for the transform pipeline
                pil_img = Image.fromarray(frame_rgb)
                
                # Preprocess and prepare batch dimension
                input_tensor = transform(pil_img).unsqueeze(0).to(device)
                
                # Run inference for this single frame
                outputs = model(input_tensor)
                prob_fake = torch.sigmoid(outputs).item()
                
                total_probability_fake += prob_fake
                extracted_frames += 1
                
            frame_count += 1

    cap.release()

    if extracted_frames == 0:
         return {"error": "Video too short or no frames could be extracted."}

    # Aggregate Confidence (Average Probability)
    avg_probability_fake = total_probability_fake / extracted_frames
    
    # Threshold for Fake vs Real
    is_fake = avg_probability_fake > 0.5
    label = "Fake" if is_fake else "Real"
    
    # Confidence Score relative to decision boundary
    confidence = avg_probability_fake if is_fake else (1 - avg_probability_fake)

    return {
        "result": label,
        "confidence": confidence,
        "frames_analyzed": extracted_frames,
        "avg_probability_fake": avg_probability_fake
    }

if __name__ == "__main__":
    import os
    from models.image_model import load_model

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Initialize model
    model = load_model(weights_path=None, model_name='resnet50', device=device)
    
    # Create a dummy video file using OpenCV for testing the script locally
    test_video = "test_video.mp4"
    if not os.path.exists(test_video):
        height, width, layers = 300, 300, 3
        fourcc = cv2.VideoWriter_fourcc(*'mp4v') # Be sure to use lower case
        video = cv2.VideoWriter(test_video, fourcc, 30, (width,height))
        
        # Write 2 seconds (60 frames)
        for j in range(60):
            # A dummy red frame
            frame = np.zeros((height, width, layers), dtype=np.uint8)
            frame[:] = (0, 0, 255) # BGR
            video.write(frame)
        video.release()
        
    print(f"\nRunning video inference on {test_video}...")
    result = predict_video(test_video, model, device=device, frames_per_second=1)
    print(f"Result: {result}")
    
    if os.path.exists(test_video):
        os.remove(test_video)
