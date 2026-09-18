import os
import json
import requests
import numpy as np
import matplotlib.pyplot as plt

API = "http://localhost:8000/ai"

BASE = "data/eval_dataset/voxceleb"
ENROLL_SPEAKER = "speaker_61"   # change if you want
IMPOSTOR_SPEAKERS = [
    d for d in os.listdir(BASE)
    if d != ENROLL_SPEAKER
]

# -------------------------
# API helpers
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
# 1️⃣ ENROLL (CENTROID)
# -------------------------
print(f"\n[ENROLL] {ENROLL_SPEAKER}")
ref_path = os.path.join(BASE, ENROLL_SPEAKER)
ref_files = sorted(os.listdir(ref_path))[:3]

embeddings = [
    enroll_single(os.path.join(ref_path, f))
    for f in ref_files
]
centroid = np.mean(embeddings, axis=0)

# -------------------------
# 2️⃣ BUILD IMPOSTOR COHORT
# -------------------------
impostor_scores = []

for spk in IMPOSTOR_SPEAKERS:
    spk_path = os.path.join(BASE, spk)
    wavs = sorted(os.listdir(spk_path))[:2]
    for w in wavs:
        s = verify_single(os.path.join(spk_path, w), centroid)
        impostor_scores.append(s)

imp_mean = np.mean(impostor_scores)
imp_std = np.std(impostor_scores)

print(f"\nImpostor mean: {imp_mean:.4f}")
print(f"Impostor std : {imp_std:.4f}")

# -------------------------
# 3️⃣ GENUINE + IMPOSTOR Z-SCORES
# -------------------------
genuine_z = []
impostor_z = []

# Genuine trials
for f in ref_files:
    s = verify_single(os.path.join(ref_path, f), centroid)
    z = (s - imp_mean) / imp_std
    genuine_z.append(z)

# Impostor trials
for s in impostor_scores:
    z = (s - imp_mean) / imp_std
    impostor_z.append(z)

# -------------------------
# 4️⃣ PLOT
# -------------------------
plt.figure(figsize=(8, 5))
plt.hist(genuine_z, bins=10, alpha=0.7, label="Genuine", color="green")
plt.hist(impostor_z, bins=10, alpha=0.7, label="Impostor", color="red")

plt.axvline(0, linestyle="--", color="black")
plt.xlabel("Z-score")
plt.ylabel("Count")
plt.title("Z-score Distribution (VoxCeleb)")
plt.legend()
plt.grid(True)
plt.tight_layout()
plt.show()
