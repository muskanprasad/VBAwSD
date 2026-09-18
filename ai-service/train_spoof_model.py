# train_spoof_model.py
#
# Small spoof-detection model using MFCC features + LogisticRegression.
# Expects data in:
#   data/spoof_dataset/genuine/*.wav   -> class 0 (real / live)
#   data/spoof_dataset/spoof/*.wav     -> class 1 (spoof / replay)

import os
import glob
import numpy as np
import librosa
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
import joblib

# --------- CONFIG ---------
# Root folder where 'genuine' and 'spoof' are:
DATA_ROOT = os.path.join("data", "dev_dataset")  # <<— HERE
TARGET_SR = 16000
N_MFCC = 20
MODEL_DIR = "models"
MODEL_PATH = os.path.join(MODEL_DIR, "spoof_model.joblib")
SCALER_PATH = os.path.join(MODEL_DIR, "spoof_scaler.joblib")


def extract_features(path: str) -> np.ndarray:
    """Load an audio file and compute MFCC mean+std features."""
    try:
        y, sr = librosa.load(path, sr=TARGET_SR, mono=True)
    except Exception as e:
        print(f"[WARN] Could not load {path}: {e}")
        return None

    # safety: replace NaN/inf
    y = np.nan_to_num(y, nan=0.0, posinf=0.0, neginf=0.0)

    # normalize
    if np.max(np.abs(y)) > 0:
        y = y / np.max(np.abs(y))

    # MFCC
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=N_MFCC)  # (n_mfcc, frames)

    # statistics over time
    mfcc_mean = np.mean(mfcc, axis=1)
    mfcc_std = np.std(mfcc, axis=1)

    feat = np.concatenate([mfcc_mean, mfcc_std])  # length = 2 * N_MFCC = 40
    return feat.astype(np.float32)


def load_dataset():
    X = []
    y = []

    # We expect:
    #   DATA_ROOT/genuine_user/*.wav -> label 0
    #   DATA_ROOT/impostor_genuine/*.wav   -> label 1
    for label_name, label_id in [("genuine_user", 0), ("impostor_genuine", 1)]:
        folder = os.path.join(DATA_ROOT, label_name)
        pattern = os.path.join(folder, "*.wav")
        files = glob.glob(pattern)

        if not files:
            print(f"[WARN] No files found in {folder}")
            continue

        print(f"[INFO] Loading {len(files)} files from {folder}")

        for fp in files:
            feat = extract_features(fp)
            if feat is None:
                continue
            X.append(feat)
            y.append(label_id)

    X = np.array(X)
    y = np.array(y, dtype=np.int64)

    print(f"[INFO] Feature matrix shape: {X.shape}, labels: {y.shape}")
    return X, y


def main():
    # 1. load dataset
    X, y = load_dataset()
    if X.size == 0:
        print("[ERROR] No data loaded. Check your dataset folders:")
        print("  data/dev_dataset/genuine_user/*.wav and data/dev_dataset/impostor_genuine/*.wav")
        return

    # 2. split train/test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # 3. scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 4. train classifier
    clf = LogisticRegression(max_iter=1000, class_weight="balanced")
    clf.fit(X_train_scaled, y_train)

    # 5. evaluate
    y_pred = clf.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n[RESULT] Test accuracy: {acc * 100:.2f}%\n")
    print(classification_report(y_test, y_pred, target_names=["genuine", "spoof"]))

    # 6. save model + scaler
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(clf, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    print(f"\n[INFO] Saved model to   {MODEL_PATH}")
    print(f"[INFO] Saved scaler to  {SCALER_PATH}")

    # 7. Extra debug: mean spoof probability for each class (over entire dataset)
    X_all_scaled = scaler.transform(X)
    spoof_proba = clf.predict_proba(X_all_scaled)[:, 1]  # prob of class "spoof" (1)

    genuine_idx = np.where(y == 0)[0]
    spoof_idx = np.where(y == 1)[0]

    if len(genuine_idx) > 0:
        print(
            f"[DEBUG] mean spoof prob (genuine) = "
            f"{spoof_proba[genuine_idx].mean():.3f}"
        )
    if len(spoof_idx) > 0:
        print(
            f"[DEBUG] mean spoof prob (spoof)   = "
            f"{spoof_proba[spoof_idx].mean():.3f}"
        )


if __name__ == "__main__":
    main()
