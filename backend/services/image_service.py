import asyncio
from models.image_model import predict_image as run_image_inference, load_model
import torch
import tempfile
import os
from models.explainability import generate_explanation

# Initialize the model once and keep it in memory
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# For hackathon/demo purposes, we load the model without weights right now
# It will just output dummy predictions if untrained, but the inference logic holds true.
model = load_model(weights_path=None, model_name='resnet50', device=device)

async def predict_image(file_bytes: bytes) -> dict:
    """
    Real image prediction pipeline using the PyTorch CNN model equipped with Grad-CAM.
    """
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        # Run inference using our model
        loop = asyncio.get_event_loop()
        prediction = await loop.run_in_executor(None, run_image_inference, tmp_path, model, device)
        
        if "error" in prediction:
             return {
                 "result": "Error",
                 "confidence": 0.0,
                 "explanation": prediction["error"]
             }
             
        label = prediction["label"]
        confidence = prediction["confidence"]
        heatmap_data = prediction.get("heatmap")
        
        # Explainability signals can be derived from confidence or specific models internally.
        # Here we mock them based on the probability output for the demo
        signals = {}
        if label == "Fake" and confidence > 0.7:
             signals = {"texture_anomaly": True, "edge_artifacts": True}
             
        explanation_data = generate_explanation(
             {"result": label, "confidence": confidence, "modality": "image"},
             signals
        )
        
        return {
            "result": label,
            "confidence": confidence,
            "explanation": explanation_data,
            "heatmap": heatmap_data
        }

    finally:
        os.remove(tmp_path)
