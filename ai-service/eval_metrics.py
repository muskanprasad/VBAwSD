import numpy as np
import matplotlib.pyplot as plt

# ---------------------------------------------------------
# Replace these with your collected Z-scores
# ---------------------------------------------------------
z_genuine = np.array([
    # paste genuine Z-scores here
])

z_impostor = np.array([
    # paste impostor Z-scores here
])

# ---------------------------------------------------------
# Compute FAR / FRR across thresholds
# ---------------------------------------------------------
def compute_far_frr(z_genuine, z_impostor, thresholds):
    fars = []
    frrs = []

    for t in thresholds:
        far = np.mean(z_impostor >= t)
        frr = np.mean(z_genuine < t)
        fars.append(far)
        frrs.append(frr)

    return np.array(fars), np.array(frrs)

# ---------------------------------------------------------
# Compute EER
# ---------------------------------------------------------
def compute_eer(z_genuine, z_impostor):
    thresholds = np.linspace(
        min(z_impostor.min(), z_genuine.min()),
        max(z_impostor.max(), z_genuine.max()),
        1000
    )

    fars, frrs = compute_far_frr(z_genuine, z_impostor, thresholds)

    idx = np.argmin(np.abs(fars - frrs))
    eer = (fars[idx] + frrs[idx]) / 2
    eer_threshold = thresholds[idx]

    return eer, eer_threshold, fars, frrs, thresholds

# ---------------------------------------------------------
# Run Evaluation
# ---------------------------------------------------------
eer, eer_threshold, fars, frrs, thresholds = compute_eer(
    z_genuine, z_impostor
)

print("\n========== EER RESULTS ==========")
print(f"EER            : {eer:.4f}")
print(f"EER Threshold  : {eer_threshold:.3f}")
print("================================\n")

# ---------------------------------------------------------
# Plot DET Curve
# ---------------------------------------------------------
plt.figure(figsize=(6, 6))
plt.plot(fars, frrs, marker="o", linewidth=2)
plt.scatter([eer], [eer], color="red", label=f"EER = {eer:.3f}")
plt.xlabel("False Accept Rate (FAR)")
plt.ylabel("False Reject Rate (FRR)")
plt.title("DET Curve (Z-score Normalized)")
plt.legend()
plt.grid(True)
plt.tight_layout()
plt.show()
