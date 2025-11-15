// server/routes/register.js
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

router.post("/", upload.single("voice"), async (req, res) => {
  try {
    const name = req.body.name || req.body.username || "guest";
    if (!req.file) return res.status(400).json({ error: "Missing file" });

    // Send to AI microservice
    const form = new FormData();
    form.append("file", req.file.buffer, { filename: req.file.originalname || "voice.wav" });

    const aiRes = await axios.post(AI_URL, form, { headers: form.getHeaders(), timeout: 30000 });

    if (aiRes.status !== 200 || !aiRes.data?.features) {
      console.error("AI service error:", aiRes.data);
      return res.status(500).json({ error: "AI service error", detail: aiRes.data });
    }

    let features = aiRes.data.features;
    if (!Array.isArray(features)) return res.status(500).json({ error: "Invalid features from AI" });

    // normalize/pad/truncate to TARGET_LEN
    if (features.length < TARGET_LEN) {
      features = features.concat(Array(TARGET_LEN - features.length).fill(0));
    } else if (features.length > TARGET_LEN) {
      features = features.slice(0, TARGET_LEN);
    }

    // Upsert user and append recording
    let user = await User.findOne({ username: name });
    if (!user) {
      user = new User({ username: name, recordings: [] });
    }
    user.recordings.push({ features });
    await user.save();

    return res.json({ ok: true, message: "Registered", features_length: features.length });
  } catch (err) {
    console.error("REGISTER error:", err?.response?.data || err.message || err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
