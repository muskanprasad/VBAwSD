# ai_service/main.py
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import io
import numpy as np
import librosa
from pydub import AudioSegment
import noisereduce as nr
import tempfile
import os
import traceback

app = FastAPI()

TARGET_SR = 16000
TARGET_FEATURE_LEN = 28  # 13 mfcc mean + 13 delta mean + pitch + energy

def convert_bytes_to_wav_bytes(file_bytes: bytes, filename_hint: str = None):
    """
    Try to convert arbitrary uploaded bytes to a WAV byte buffer (mono, 16k).
    Uses pydub (ffmpeg) and temporary files as fallbacks.
    """
    # Try to load from bytes directly with pydub (it will use ffmpeg)
    audio = None
    try:
        fmt = None
        if filename_hint and "." in filename_hint:
            fmt = filename_hint.rsplit(".", 1)[1].lower()
        audio = AudioSegment.from_file(io.BytesIO(file_bytes), format=fmt)
    except Exception:
        # fallback: write to temp file and ask pydub to read (ffmpeg will detect)
        try:
            with tempfile.NamedTemporaryFile(delete=False) as tmp:
                tmp.write(file_bytes)
                tmp.flush()
                tmpname = tmp.name
            audio = AudioSegment.from_file(tmpname)  # ffmpeg autodetect
        finally:
            try:
                os.unlink(tmpname)
            except Exception:
                pass

    if audio is None:
        raise RuntimeError("Could not decode audio with pydub/ffmpeg")

    # Force mono
    if audio.channels > 1:
        audio = audio.set_channels(1)
    # Force sample rate
    if audio.frame_rate != TARGET_SR:
        audio = audio.set_frame_rate(TARGET_SR)
    # Force sample width 2 (16-bit)
    audio = audio.set_sample_width(2)

    out = io.BytesIO()
    audio.export(out, format="wav")
    out.seek(0)
    return out.read()

def wav_bytes_to_numpy(wav_bytes: bytes):
    # librosa can load from bytes via soundfile using io.BytesIO
    try:
        y, sr = librosa.load(io.BytesIO(wav_bytes), sr=TARGET_SR, mono=True)
        return y, sr
    except Exception as e:
        raise RuntimeError(f"librosa failed to load wav bytes: {e}")

def extract_features(y: np.ndarray, sr: int):
    # Optional: light normalization
    if np.max(np.abs(y)) > 0:
        y = y / np.max(np.abs(y))

    # Noise reduce (best-effort)
    try:
        y = nr.reduce_noise(y=y, sr=sr)
    except Exception:
        # if noisereduce fails, continue with original
        pass

    # MFCCs
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc_mean = np.mean(mfcc, axis=1)  # length 13

    # Delta mfcc (first order)
    delta = librosa.feature.delta(mfcc)
    delta_mean = np.mean(delta, axis=1)  # length 13

    # Pitch estimation (use piptrack)
    pitches, mags = librosa.piptrack(y=y, sr=sr)
    pitches_nonzero = pitches[pitches > 0]
    pitch_mean = float(np.mean(pitches_nonzero)) if pitches_nonzero.size > 0 else 0.0

    # Energy (RMS)
    energy = float(np.mean(librosa.feature.rms(y=y)))

    feat = np.concatenate([mfcc_mean, delta_mean, np.array([pitch_mean, energy])])
    # Ensure float and Python numbers
    feat = [float(x) for x in feat.tolist()]
    return feat

@app.post("/analyze-voice")
async def analyze_voice(file: UploadFile = File(...)):
    """
    Accepts an uploaded audio file (any format ffmpeg understands).
    Returns: { "features": [28 floats] }
    """
    try:
        raw = await file.read()
        # Use filename hint to help pydub detect format
        fname = getattr(file, "filename", None)
        wav_bytes = convert_bytes_to_wav_bytes(raw, filename_hint=fname)
        y, sr = wav_bytes_to_numpy(wav_bytes)
        features = extract_features(y, sr)

        # enforce target length: pad/truncate to TARGET_FEATURE_LEN
        if len(features) < TARGET_FEATURE_LEN:
            features = features + [0.0] * (TARGET_FEATURE_LEN - len(features))
        elif len(features) > TARGET_FEATURE_LEN:
            features = features[:TARGET_FEATURE_LEN]

        return {"features": features}
    except Exception as e:
        tb = traceback.format_exc()
        return JSONResponse(status_code=500, content={"error": f"Voice processing failed: {str(e)}", "trace": tb})

