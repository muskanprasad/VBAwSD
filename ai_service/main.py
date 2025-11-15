# ai_service/main.py
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import numpy as np
import librosa
from pydub import AudioSegment
import io
import noisereduce as nr

app = FastAPI()

@app.post("/analyze-voice")
async def analyze_voice(file: UploadFile = File(...)):
    try:
        # Read uploaded audio
        audio_bytes = await file.read()

        # Convert WEBM → WAV using ffmpeg in pydub
        audio = AudioSegment.from_file(io.BytesIO(audio_bytes))

        # Resample to 16k mono
        audio = audio.set_frame_rate(16000).set_channels(1)

        wav_buffer = io.BytesIO()
        audio.export(wav_buffer, format="wav")
        wav_buffer.seek(0)

        # Now librosa can read it safely
        y, sr = librosa.load(wav_buffer, sr=16000)

        # Noise reduction
        y = nr.reduce_noise(y=y, sr=sr)

        # Extract MFCC (13)
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfcc, axis=1)

        # Pitch
        pitches, mags = librosa.piptrack(y=y, sr=sr)
        pitch = np.mean(pitches[pitches > 0]) if np.any(pitches > 0) else 0

        # Energy
        energy = float(np.mean(librosa.feature.rms(y=y)))

        features = np.concatenate([mfcc_mean, [pitch, energy]])

        return {"features": features.tolist()}

    except Exception as e:
        return {"error": f"Voice processing failed: {str(e)}"}
