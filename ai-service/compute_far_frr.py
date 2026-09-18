import os
import json
import requests
import numpy as np

API = "http://localhost:8000/ai"

BASE = "data/eval_dataset/voxceleb"
ENROLL_SPEAKER = "speaker_61"

# -------------------------
# Helpers
# -------------------------
def enroll_single(wav):
    with open(wav, "rb") as f:
        r = requests.post(f"{API}/enroll", files={"file": f})
    r.raise_for_status()
    return np.array(r.json()["embedding"], dtype=np.float32)

def verify_single(wav, centroid):
    payload = {
        "stored_embedding": json.dumps(centroid.tolist())
    }
    with open(wav, "rb") as f:
        r = requests.post(
            f"{API}/verify",
            data=payload,
            files={"file": f}
        )
    r.raise_for_status()
    return r.json()["similarity"]

# -------------------------
# 1️⃣ Enroll centroid
# -------------------------
ref_path = os.path.join(BASE, ENROLL_SPEAKER)
ref_files = sorted(os.listdir(ref_path))[:3]

embeddings = [
    enroll_single(os.path.join(ref_path, f))
    for f in ref_files
]
centroid = np.mean(embeddings, axis=0)

# -------------------------
# 2️⃣ Build impostor cohort
# -------------------------
impostor_scores = []
genuine_scores = []

for spk in os.listdir(BASE):
    spk_path = os.path.join(BASE, spk)
    wavs = sorted(os.listdir(spk_path))[:2]

    for w in wavs:
        s = verify_single(os.path.join(spk_path, w), centroid)
        if spk == ENROLL_SPEAKER:
            genuine_scores.append(s)
        else:
            impostor_scores.append(s)

imp_mean = np.mean(impostor_scores)
imp_std = np.std(impostor_scores)

# Convert to z-scores
genuine_z = [(s - imp_mean) / imp_std for s in genuine_scores]
impostor_z = [(s - imp_mean) / imp_std for s in impostor_scores]

# -------------------------
# 3️⃣ FAR / FRR sweep
# -------------------------
print("\nZ-threshold | FAR     | FRR")
print("-------------------------------")

thresholds = np.arange(-1.0, 2.5, 0.1)

for zt in thresholds:
    FAR = sum(z >= zt for z in impostor_z) / len(impostor_z)
    FRR = sum(z < zt for z in genuine_z) / len(genuine_z)

    print(f"{zt:8.2f} | {FAR:7.4f} | {FRR:7.4f}")
