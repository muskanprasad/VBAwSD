// server/routes/register.js
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";
import { v4 as uuidv4 } from "uuid";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();
const upload = multer(); // memory storage (we'll stream to AI service)
const AI_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000/analyze-voice";

// Register voice sample (authenticated or guest if you prefer)
router.post("/register", upload.single("voice"), authMiddleware, async (req, res) => {
  try {
    // require a user
    const username = req.body.name || req.user?.username;
    if (!username) return res.status(400).json({ error: "No username provided" });

    if (!req.file) return res.status(400).json({ error: "No voice file uploaded" });

    // Send file bytes to AI microservice
    const form = new FormData();
    form.append("file", req.file.buffer, { filename: req.file.originalname || "voice.webm" });

    const aiRes = await axios.post(AI_URL, form, { headers: form.getHeaders(), timeout: 30000 });
    if (aiRes.status !== 200 || aiRes.data.error) {
      console.error("AI service error:", aiRes.data);
      return res.status(500).json({ error: "Feature extraction failed" });
    }

    const features = aiRes.data.features || aiRes.data.feature_vector || aiRes.data; // flexible

    // store user & recording
    let user = await User.findOne({ username });
    if (!user) {
      user = new User({ username, password: "placeholder" }); // placeholder means guest; better to require auth
      await user.save();
    }

    const fileId = uuidv4();
    // For simplicity we won't store actual wav file on disk here; cleaned_url can be URL to file storage if you add it.
    const rec = {
      file_id: fileId,
      cleaned_url: aiRes.data.cleaned_url || null,
      created_at: new Date(),
      features: Array.isArray(features) ? features : []
    };

    user.recordings.push(rec);
    await user.save();

    res.json({ message: "Registered", recording: rec });
  } catch (err) {
    console.error("REGISTER - Error:", err?.response?.data || err.message || err);
    res.status(500).json({ error: "Registration failed" });
  }
});

export default router;
