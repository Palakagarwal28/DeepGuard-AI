import asyncio
import os
from models.audio_model import predict_audio as run_audio_inference, load_or_train_classifier
from models.explainability import generate_explanation

# Load (or simulate) the RandomForest model once globally
# Store it in the models directory alongside the script for persistence
model_file_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'audio_classifier.pkl')
clf = load_or_train_classifier(model_file_path)

async def predict_audio(file_path: str) -> dict:
    """
    Real audio prediction pipeline using librosa MFCCs and Sklearn.
    """
    try:
        # Run inference using run_in_executor to avoid blocking the asyncio event loop
        # Feature extraction (librosa) and sklearn prediction are synchronous
        loop = asyncio.get_event_loop()
        prediction = await loop.run_in_executor(None, run_audio_inference, file_path, clf)
        
        if "error" in prediction:
             return {
                 "result": "Error",
                 "confidence": 0.0,
                 "explanation": prediction["error"]
             }
             
        label = prediction["result"]
        confidence = prediction["confidence"]
        feature_len = prediction.get("mfcc_shape", 13)
        
        signals = {}
        if label == "Fake" and confidence > 0.6:
            signals = {"mfcc_deviation": True, "pitch_instability": True}
            
        explanation_data = generate_explanation(
             {"result": label, "confidence": float(confidence), "modality": "audio"},
             signals
        )
        
        return {
            "result": label,
            "confidence": float(confidence),
            "explanation": explanation_data
        }
        
    except Exception as e:
        return {
            "result": "Error",
            "confidence": 0.0,
            "explanation": str(e)
        }
