from fastapi import FastAPI, UploadFile, File, Form, HTTPException
import numpy as np
import librosa
import joblib
import os
import json
import io
import soundfile as sf

app = FastAPI()

# ================= PATHS =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SPOOF_MODEL_PATH = os.path.join(BASE_DIR, "models", "spoof_model.joblib")
SPOOF_SCALER_PATH = os.path.join(BASE_DIR, "models", "spoof_scaler.joblib")

spoof_model = joblib.load(SPOOF_MODEL_PATH)
spoof_scaler = joblib.load(SPOOF_SCALER_PATH)

# ================= FINAL THRESHOLDS =================
Z_THRESHOLD = 1.20
SPOOF_THRESHOLD = 0.30

# ================= AUDIO =================
def load_audio(file_bytes, target_sr=16000):
    audio, sr = sf.read(io.BytesIO(file_bytes), dtype="float32")
    if audio.ndim > 1:
        audio = np.mean(audio, axis=1)
    if sr != target_sr:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=target_sr)
    return audio

def extract_embedding(audio):
    mfcc = librosa.feature.mfcc(y=audio, sr=16000, n_mfcc=40)
    emb = np.mean(mfcc, axis=1)
    emb /= (np.linalg.norm(emb) + 1e-6)
    return emb

def compute_spoof_score(audio):
    mfcc = librosa.feature.mfcc(y=audio, sr=16000, n_mfcc=40)
    feat = np.mean(mfcc, axis=1)
    feat = spoof_scaler.transform([feat])
    return float(spoof_model.predict_proba(feat)[0][1])

# ================= ENROLL =================
@app.post("/ai/enroll")
async def enroll(file: UploadFile = File(...)):
    try:
        audio = load_audio(await file.read())
        emb = extract_embedding(audio)
        return {"embedding": emb.tolist()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================= VERIFY =================
@app.post("/ai/verify")
async def verify(
    file: UploadFile = File(...),
    stored_embedding: str = Form(...),
    z_score: float = Form(...)
):
    try:
        centroid = np.array(json.loads(stored_embedding), dtype=np.float32)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid centroid")

    audio = load_audio(await file.read())
    emb = extract_embedding(audio)

    similarity = float(np.dot(emb, centroid))
    spoof_score = compute_spoof_score(audio)

    if spoof_score >= SPOOF_THRESHOLD:
        decision = "REJECT"
        reason = "Spoof detected"
    elif z_score < Z_THRESHOLD:
        decision = "REJECT"
        reason = "Low similarity"
    else:
        decision = "ACCEPT"
        reason = "Voice matched"

    return {
        "similarity": round(similarity, 6),
        "zScore": round(z_score, 3),
        "spoofScore": round(spoof_score, 6),
        "decision": decision,
        "reason": reason
    }
