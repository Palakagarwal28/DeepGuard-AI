import asyncio
import torch
from models.video_model import predict_video as run_video_inference
from models.explainability import generate_explanation

# We can re-use the image CNN model instance established in image_service if we want
# or import the already instantiated model. To keep it clean, we import the model globally from image_service
from services.image_service import model, device

async def predict_video(file_path: str) -> dict:
    """
    Real video prediction pipeline using OpenCV and the PyTorch CNN model.
    """
    
    try:
        # Run inference using our video extraction script
        # Using run_in_executor to avoid blocking the asyncio event loop
        loop = asyncio.get_event_loop()
        prediction = await loop.run_in_executor(None, run_video_inference, file_path, model, device, 1)
        
        if "error" in prediction:
             return {
                 "result": "Error",
                 "confidence": 0.0,
                 "explanation": prediction["error"]
             }
             
        label = prediction["result"]
        confidence = prediction["confidence"]
        frames_analyzed = prediction["frames_analyzed"]
        
        signals = {}
        if label == "Fake" and confidence > 0.65:
             signals = {"high_variance": True, "flickering": True}
             
        explanation_data = generate_explanation(
             {"result": label, "confidence": confidence, "modality": "video"},
             signals
        )
        
        return {
            "result": label,
            "confidence": confidence,
            "explanation": explanation_data
        }
        
    except Exception as e:
        return {
            "result": "Error",
            "confidence": 0.0,
            "explanation": str(e)
        }
