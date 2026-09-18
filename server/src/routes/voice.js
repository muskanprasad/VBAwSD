// routes/voice.js
const express = require("express");
const axios = require("axios");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const LoginAttempt = require("../models/LoginAttempt");

const router = express.Router();
const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

function bufferToBase64(buf) {
  return Buffer.from(buf).toString("base64");
}

/* ---------------- ENROLL ---------------- */
router.post("/enroll", authMiddleware(), async (req, res) => {
  try {
    const userId = req.user.id;

    // Accept either raw wav body or form-data file (Express raw middleware handles raw wav)
    const contentType = req.headers["content-type"] || "";
    let audioBuffer = null;

    if (contentType.includes("audio/") || contentType.includes("application/octet-stream")) {
      // raw bytes in req.body (ensure your server is configured with express.raw for audio/wav)
      audioBuffer = req.body;
    } else if (req.files && req.files.audio) {
      audioBuffer = req.files.audio.data;
    } else {
      return res.status(400).json({ message: "No WAV audio received" });
    }

    // forward raw bytes to AI service
    const aiRes = await axios.post(`${AI_URL}/ai/enroll`, audioBuffer, {
      headers: { "Content-Type": "audio/wav" },
      timeout: 30000,
    });

    const { embedding, spoofScore } = aiRes.data;

    if (!embedding) {
      return res
        .status(500)
        .json({ message: "AI did not return a valid embedding" });
    }

    // save to user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // If first enroll -> store directly
    if (!user.voiceprint || user.voiceprint.length === 0) {
      user.voiceprint = embedding;
      user.numSamples = 1;
    } else {
      // Average embeddings (keep numbers)
      const old = user.voiceprint;
      const newEmb = embedding;
      const avg = old.map((v, i) => (v * user.numSamples + newEmb[i]) / (user.numSamples + 1));
      user.voiceprint = avg;
      user.numSamples++;
    }

    await user.save();

    res.json({
      message: "Enrollment successful",
      numSamples: user.numSamples,
      spoofScore,
    });
  } catch (err) {
    console.error("Enroll error:", err.message || err);
    return res.status(500).json({ message: "Server error during enrollment" });
  }
});

/* ---------------- VERIFY ---------------- */
router.post("/verify", authMiddleware(), async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user || !user.voiceprint || user.voiceprint.length === 0) {
      return res.status(400).json({ message: "User has no enrolled samples" });
    }

    // Accept multiple payload styles:
    // 1) JSON { audio: "<base64>" }
    // 2) raw audio/wav bytes in body
    let audioBase64 = null;
    const contentType = req.headers["content-type"] || "";

    if (contentType.includes("application/json") && req.body && req.body.audio) {
      audioBase64 = req.body.audio;
    } else if (contentType.includes("audio/") || contentType.includes("application/octet-stream")) {
      audioBase64 = bufferToBase64(req.body);
    } else if (req.files && req.files.audio) {
      audioBase64 = bufferToBase64(req.files.audio.data);
    } else {
      return res.status(400).json({ message: "Audio not provided" });
    }

    // call AI verify endpoint with base64 audio + stored embedding
    const aiRes = await axios.post(`${AI_URL}/ai/verify`, {
      audio: audioBase64,
      storedEmbedding: user.voiceprint,
    }, { timeout: 30000 });

    const { similarity, spoofScore, decision, reason } = aiRes.data;
    const success = decision === "ACCEPT";

    // Log login attempt
    await LoginAttempt.create({
      username: user.username,
      success,
      similarityScore: similarity,
      spoofScore,
      reason,
    });

    res.json({
      success,
      similarity,
      spoofScore,
      decision,
      reason,
    });
  } catch (err) {
    console.error("Verify error:", err.message || err);
    return res.status(500).json({ message: "Server error during verification" });
  }
});

module.exports = router;
