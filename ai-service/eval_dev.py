import os, json, requests

API = "http://localhost:8000/ai"

def enroll(path):
    with open(path, "rb") as f:
        r = requests.post(f"{API}/enroll", files={"file": f})
    return r.json()["embedding"]

def verify(path, emb):
    with open(path, "rb") as f:
        r = requests.post(
            f"{API}/verify",
            files={
                "file": f,
                "stored_embedding": (None, json.dumps(emb))
            }
        )
    return r.json()

# ---- ENROLL (your voice)
base = "data/dev_dataset/genuine_user"
files = sorted(os.listdir(base))
emb1 = enroll(os.path.join(base, files[0]))
emb2 = enroll(os.path.join(base, files[1]))

ref = [(a+b)/2 for a,b in zip(emb1, emb2)]

# ---- VERIFY genuine
print("GENUINE:", verify(os.path.join(base, files[-1]), ref))

# ---- VERIFY impostor
imp = "data/dev_dataset/impostor_genuine"
imp_file = os.listdir(imp)[0]
print("IMPOSTOR:", verify(os.path.join(imp, imp_file), ref))
