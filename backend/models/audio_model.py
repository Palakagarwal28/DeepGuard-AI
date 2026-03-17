import librosa
import numpy as np
import os
import joblib
from sklearn.ensemble import RandomForestClassifier

def extract_features(audio_path: str) -> np.ndarray:
    """
    Extracts MFCC features from an audio file using librosa.
    Handles wav, mp3, and short clips by calculating the mean MFCCs.
    
    Args:
        audio_path: Path to the audio file.
        
    Returns:
        np.ndarray: A 1D array of MFCC features, or None if failed.
    """
    try:
        # Load audio file (sr=None preserves original sampling rate)
        # We load a small duration (e.g., up to 5 seconds) to keep it fast for inference
        y, sr = librosa.load(audio_path, sr=None, duration=5.0)
        
        # If the audio clip is too short/empty, handle it
        if len(y) == 0:
            return None
            
        # Extract MFCCs (13 coefficients is standard for speech)
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        
        # Take the mean of each coefficient across time frames to get a fixed-size vector
        mfccs_mean = np.mean(mfccs.T, axis=0)
        
        return mfccs_mean
        
    except Exception as e:
        print(f"Error extracting features from {audio_path}: {e}")
        return None

def load_or_train_classifier(model_path: str = "audio_classifier.pkl") -> RandomForestClassifier:
    """
    Loads a pretrained RandomForest model if it exists.
    Otherwise, trains a quick dummy classifier for hackathon demonstration.
    """
    if os.path.exists(model_path):
        return joblib.load(model_path)
    
    # Simulate a trained model (Dummy Training)
    print("No pre-trained audio model found. Training a dummy simulated classifier...")
    
    # Generate random mock MFCC vectors (13 features each)
    # Real = 0, Fake = 1
    X_dummy = np.random.rand(100, 13)
    y_dummy = np.random.randint(0, 2, 100)
    
    clf = RandomForestClassifier(n_estimators=50, random_state=42)
    clf.fit(X_dummy, y_dummy)
    
    # Optionally save it so we don't retrain on every load
    try:
        joblib.dump(clf, model_path)
    except:
        pass
        
    return clf

def predict_audio(audio_path: str, clf: RandomForestClassifier) -> dict:
    """
    Runs feature extraction and classification on an audio file.
    
    Args:
        audio_path: Path to the audio file.
        clf: Trained sklearn classifier (e.g., RandomForest).
        
    Returns:
        dict: The predicted result and confidence score.
    """
    features = extract_features(audio_path)
    
    if features is None:
        return {"error": "Failed to extract audio features. The file may be empty, corrupt, or an unsupported format."}
    
    # Reshape for sklearn prediction (1 sample, n_features)
    X = features.reshape(1, -1)
    
    # Get probabilities
    probabilities = clf.predict_proba(X)[0]
    
    # Assuming class 0 is Real, class 1 is Fake
    prob_real = probabilities[0]
    prob_fake = probabilities[1]
    
    is_fake = prob_fake > 0.5
    label = "Fake" if is_fake else "Real"
    
    # Confidence is the probability of the predicted class
    confidence = prob_fake if is_fake else prob_real

    return {
        "result": label,
        "confidence": confidence,
        "mfcc_shape": features.shape[0] # Return the feature length for explanation
    }


if __name__ == "__main__":
    import soundfile as sf
    import os
    
    # 1. Load the model
    classifier = load_or_train_classifier("test_audio_model.pkl")
    
    # 2. Generate a dummy wav file (1 second of white noise)
    test_audio = "test_audio.wav"
    if not os.path.exists(test_audio):
        samplerate = 22050
        data = np.random.uniform(-1, 1, samplerate)
        sf.write(test_audio, data, samplerate)
        
    print(f"\nRunning audio inference on {test_audio}...")
    result = predict_audio(test_audio, classifier)
    print(f"Result: {result}")
    
    # Cleanup dummy files
    if os.path.exists(test_audio):
        os.remove(test_audio)
    if os.path.exists("test_audio_model.pkl"):
        os.remove("test_audio_model.pkl")
