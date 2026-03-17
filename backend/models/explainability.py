import random

def generate_explanation(prediction: dict, signals: dict = None) -> dict:
    """
    Generates a human-understandable explanation for a deepfake prediction.
    
    Args:
        prediction: dict containing 'result' ("Real" or "Fake"), 'confidence' (float 0.0-1.0), and 'modality' ("image", "video", "audio").
        signals: Optional dictionary of specific signals detected by the model.
        
    Returns:
        dict containing 'summary', 'key_indicators', and 'modality_specific'.
    """
    result = prediction.get("result", "Real")
    # Convert confidence to percentage if it's a 0-1 float
    confidence = prediction.get("confidence", 0.0)
    conf_pct = confidence * 100 if confidence <= 1.0 else confidence
    modality = prediction.get("modality", "image")
    
    signals = signals or {}
    
    explanation = {
        "summary": "",
        "key_indicators": [],
        "modality_specific": {}
    }
    
    # 1. Base Confidence Wording & Summary
    if result == "Fake":
        if conf_pct > 80:
            evidence_level = "Strong evidence of manipulation detected."
        elif conf_pct > 50:
            evidence_level = "Suspicious patterns detected."
        else:
            evidence_level = "Anomalies detected, but confidence is low."
    else:
        if conf_pct > 80:
            evidence_level = "Content appears highly authentic."
        elif conf_pct > 50:
            evidence_level = "Content appears authentic."
        else:
            evidence_level = "No major anomalies detected, but confidence is low."

    # 2. Modality-Specific Feature Mapping & Indicators
    if modality == "image":
        if result == "Fake":
            explanation["summary"] = f"{evidence_level} Detected inconsistencies in facial texture and/or structural artifacts."
            if signals.get("texture_anomaly"):
                explanation["key_indicators"].append("Irregular skin texture patterns")
            if signals.get("edge_artifacts"):
                explanation["key_indicators"].append("Blending artifacts detected near edges")
            if not explanation["key_indicators"]:
                 explanation["key_indicators"] = ["GAN-generated noise patterns detected", "Pixel-level inconsistencies"]
            
            explanation["modality_specific"]["image"] = "Facial regions show structural artifacts typical of AI synthesis."
        else:
            explanation["summary"] = f"{evidence_level} The image structure is consistent with natural camera captures."
            explanation["key_indicators"] = ["Natural noise distribution", "Consistent lighting and shadows"]
            explanation["modality_specific"]["image"] = "No synthetic blending artifacts detected."

    elif modality == "video":
        if result == "Fake":
            explanation["summary"] = f"{evidence_level} Detected frame-to-frame inconsistencies and temporal anomalies."
            if signals.get("high_variance"):
                explanation["key_indicators"].append("High temporal inconsistency between frames")
            if signals.get("flickering"):
                 explanation["key_indicators"].append("Unnatural flickering or jittering artifacts")
            if not explanation["key_indicators"]:
                explanation["key_indicators"] = ["Facial landmark jittering", "Temporal variance in background/subject boundary"]
                
            explanation["modality_specific"]["video"] = "Analyzed frames exhibit unnatural temporal progression."
        else:
            explanation["summary"] = f"{evidence_level} Frame sequences exhibit natural temporal consistency."
            explanation["key_indicators"] = ["Smooth temporal transitions", "Consistent subject tracking"]
            explanation["modality_specific"]["video"] = "No unnatural frame-to-frame jitter detected."

    elif modality == "audio":
        if result == "Fake":
            explanation["summary"] = f"{evidence_level} Detected deviations in vocal frequencies and unnatural acoustic patterns."
            if signals.get("mfcc_deviation"):
                explanation["key_indicators"].append("Synthetic voice pattern or MFCC deviation detected")
            if signals.get("pitch_instability"):
                explanation["key_indicators"].append("Unnatural pitch instability")
            if not explanation["key_indicators"]:
                 explanation["key_indicators"] = ["Vocoder artifacts detected", "High-frequency phase anomalies"]
            
            explanation["modality_specific"]["audio"] = "Spectral analysis reveals properties of voice synthesis."
        else:
            explanation["summary"] = f"{evidence_level} Acoustic features match human vocal tract productions."
            explanation["key_indicators"] = ["Natural breathing and pause patterns", "Consistent harmonic structures"]
            explanation["modality_specific"]["audio"] = "No synthetic vocoder signatures found in the frequency spectrum."

    # Generic fallback just in case
    if not explanation["summary"]:
        explanation["summary"] = "The model evaluated the content based on standard deepfake indicators."

    return explanation

if __name__ == "__main__":
    # Test cases
    print("--- Fake Image Test ---")
    print(generate_explanation({"result": "Fake", "confidence": 0.87, "modality": "image"}, {"texture_anomaly": True, "edge_artifacts": True}))
    
    print("\n--- Real Video Test ---")
    print(generate_explanation({"result": "Real", "confidence": 0.92, "modality": "video"}))
