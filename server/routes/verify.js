// server/routes/verify.js
import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const AI_URL = process.env.AI_SERVICE_URL;
const TARGET_LEN = 28;
const THRESHOLD = 0.75; // tune as needed

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
function norm(a) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * a[i];
  return Math.sqrt(s);
}
function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  const d = dot(a, b);
  const na = norm(a);
  const nb = norm(b);
  if (na === 0 || nb === 0) return 0;
  return d / (na * nb);
}

router.post("/", upload.single("voice"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Missing file" });

    const form = new FormData();
    form.append("file", req.file.buffer, { filename: req.file.originalname || "voice.wav" });

    const aiRes = await axios.post(AI_URL, form, { headers: form.getHeaders(), timeout: 30000 });
    if (aiRes.status !== 200 || !aiRes.data?.features) {
      console.error("AI service error:", aiRes.data);
      return res.status(500).json({ error: "AI service error", detail: aiRes.data });
    }

    let features = aiRes.data.features;
    if (!Array.isArray(features)) return res.status(500).json({ error: "Invalid features" });

    // normalize/pad/truncate to TARGET_LEN
    if (features.length < TARGET_LEN) {
      features = features.concat(Array(TARGET_LEN - features.length).fill(0));
    } else if (features.length > TARGET_LEN) {
      features = features.slice(0, TARGET_LEN);
    }

    const users = await User.find({}).lean();
    let bestScore = -1;
    let bestUser = null;

    for (const u of users) {
      if (!Array.isArray(u.recordings) || u.recordings.length === 0) continue;
      for (const rec of u.recordings) {
        if (!rec.features) continue;
        let stored = rec.features;
        // pad/truncate stored too (just in case)
        if (stored.length < TARGET_LEN) stored = stored.concat(Array(TARGET_LEN - stored.length).fill(0));
        if (stored.length > TARGET_LEN) stored = stored.slice(0, TARGET_LEN);

        const score = cosine(features, stored);
        if (score > bestScore) {
          bestScore = score;
          bestUser = u.username;
        }
      }
    }

    const verified = bestScore >= THRESHOLD;
    return res.json({ verified, matchedUser: bestUser, confidence: bestScore || 0 });
  } catch (err) {
    console.error("VERIFY error:", err?.response?.data || err.message || err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
