// server/routes/verify.js
import express from "express";
import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";
import ffmpeg from "fluent-ffmpeg";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import User from "../models/User.js"; // adjust path if different
import similarity from "../utils/similarity.js"; // your similarity function

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // keep in memory then convert

// helper: convert buffer (any format) -> WAV file path using ffmpeg
function bufferToWavFile(buffer) {
  return new Promise((resolve, reject) => {
    const tmpName = `${uuidv4()}.wav`;
    const tmpPath = path.join(process.cwd(), "uploads", tmpName);

    // ensure uploads dir exists
    fs.mkdirSync(path.join(process.cwd(), "uploads"), { recursive: true });

    // Write input temp file (we'll stream input from buffer)
    const inputPath = path.join(process.cwd(), "uploads", `${uuidv4()}.input`);
    fs.writeFileSync(inputPath, buffer);

    ffmpeg(inputPath)
      .toFormat("wav")
      .audioChannels(1)
      .audioFrequency(16000)
      .on("error", (err) => {
        try { fs.unlinkSync(inputPath); } catch(e){}
        reject(err);
      })
      .on("end", () => {
        try { fs.unlinkSync(inputPath); } catch(e){}
        resolve(tmpPath);
      })
      .save(tmpPath);
  });
}

router.post("/", upload.single("voice"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Missing 'voice' file" });

    // convert incoming buffer to WAV on server (so FastAPI/librosa will accept)
    const wavPath = await bufferToWavFile(req.file.buffer);

    // send to AI microservice (FastAPI) as 'file'
    const form = new FormData();
    form.append("file", fs.createReadStream(wavPath), "voice.wav");

    const AI_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000/analyze-voice";

    const aiResp = await axios.post(AI_URL, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // aiResp.data should include features array
    const features = aiResp.data.features || aiResp.data; // adapt if different shape
    if (!features || !Array.isArray(features)) {
      fs.unlinkSync(wavPath);
      return res.status(500).json({ error: "AI didn't return features" });
    }

    // Fetch all stored users and compare
    const users = await User.find({}).lean();
    if (!users || users.length === 0) {
      fs.unlinkSync(wavPath);
      return res.json({ verified: false, matchedUser: null, confidence: 0 });
    }

    // compute similarity to each stored user (assuming user.recordings[0].features)
    let best = { name: null, score: 0 };
    for (const u of users) {
      // ensure user has stored 'avg_features' or first recording features
      const storedFeatures = u.avg_features || (u.recordings && u.recordings[0] && u.recordings[0].features);
      if (!storedFeatures) continue;
      const score = similarity(features, storedFeatures); // returns 0..1 (higher better)
      if (Number.isFinite(score) && score > best.score) {
        best = { name: u.username || u.name || u._id, score };
      }
    }

    // cleanup
    fs.unlinkSync(wavPath);

    const threshold = parseFloat(process.env.VERIFY_THRESHOLD || "0.65"); // tuneable
    const verified = best.name && best.score >= threshold;

    return res.json({
      verified,
      matchedUser: best.name,
      confidence: best.score || 0,
    });
  } catch (err) {
    console.error("Verify route error:", err?.message || err);
    return res.status(500).json({ error: "Verify failed", detail: err?.message || err });
  }
});

export default router;
