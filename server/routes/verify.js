// server/routes/verify.js
import express from "express";
import multer from "multer";
import FormData from "form-data";
import fs from "fs";
import axios from "axios";
import User from "../models/User.js";
import { cosineSimilarity } from "../utils/similarity.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// -----------------------------
// VERIFY USER VOICE
// -----------------------------
router.post("/", upload.single("voice"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file received" });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Send audio → FastAPI
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath), fileName);

    let fastapiResp;
    try {
      fastapiResp = await axios.post(process.env.AI_SERVICE_URL, formData, {
        headers: formData.getHeaders(),
      });
    } catch (err) {
      console.error("❌ FastAPI error:", err.response?.data || err.message);
      return res.status(500).json({ error: "AI service error" });
    }

    fs.unlinkSync(filePath); // cleanup temp file

    const features = fastapiResp.data.features;
    if (!features || !Array.isArray(features)) {
      return res.status(400).json({ error: "Invalid feature vector" });
    }

    console.log("🎤 VERIFY INPUT FEATURES LENGTH:", features.length);

    // Fetch all users
    const users = await User.find({});
    let bestScore = -1;
    let bestUser = null;

    for (const user of users) {
      if (!user.voiceFeatures || user.voiceFeatures.length === 0) continue;

      console.log(`🔍 Comparing with ${user.username}`);

      const score = cosineSimilarity(features, user.voiceFeatures);

      console.log(`➡ Score vs ${user.username}:`, score);

      if (score > bestScore) {
        bestScore = score;
        bestUser = user.username;
      }
    }

    // Threshold (you can fine-tune this)
    const MATCH_THRESHOLD = 0.80;

    if (bestScore >= MATCH_THRESHOLD) {
      console.log(`✅ MATCHED → ${bestUser} | Score: ${bestScore}`);
      return res.json({
        verified: true,
        matchedUser: bestUser,
        confidence: bestScore,
      });
    } else {
      console.log(`❌ NO MATCH | Highest Score: ${bestScore}`);
      return res.json({
        verified: false,
        matchedUser: null,
        confidence: bestScore,
      });
    }
  } catch (err) {
    console.error("❌ Verify route error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
