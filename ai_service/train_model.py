# train_model.py
import numpy as np
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import normalize
import os
import sys

# Paths (adjust if needed)
X_PATH = "training_features.npy"
Y_PATH = "training_labels.npy"
OUT_MODEL = "voice_model.pkl"
OUT_SCALER = "feature_norm_info.pkl"

if not os.path.exists(X_PATH) or not os.path.exists(Y_PATH):
    print("ERROR: training files not found. Please create training_features.npy and training_labels.npy")
    sys.exit(1)

X = np.load(X_PATH)  # shape (num_samples, num_features)
y = np.load(Y_PATH)  # shape (num_samples,)

# L2-normalize rows
X_norm = normalize(X, norm='l2', axis=1)

# Train a simple classifier (optional)
model = LogisticRegression(max_iter=1000)
model.fit(X_norm, y)

# Save model and some metadata (here just to remember normalization type)
joblib.dump(model, OUT_MODEL)
joblib.dump({"norm": "l2", "axis": 1}, OUT_SCALER)

print(f"✅ Model trained and saved as {OUT_MODEL}")
