import base64

wav_path = "data/spoof_dataset/genuine/m3.wav"

with open(wav_path, "rb") as f:
    b64 = base64.b64encode(f.read()).decode()

print(b64)
