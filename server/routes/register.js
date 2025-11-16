// server/routes/register.js
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import axios from "axios";
import FormData from "form-data";
import { v4 as uuidv4 } from "uuid";
import User from "../models/User.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/* Convert any audio buffer → WAV (16 kHz mono) */
function bufferToWav(buffer) {
    return new Promise((resolve, reject) => {
        const tempIn = path.join("uploads", `${uuidv4()}.input`);
        const tempOut = path.join("uploads", `${uuidv4()}.wav`);
        fs.writeFileSync(tempIn, buffer);

        ffmpeg(tempIn)
            .audioChannels(1)
            .audioFrequency(16000)
            .toFormat("wav")
            .on("end", () => {
                fs.unlinkSync(tempIn);
                resolve(tempOut);
            })
            .on("error", err => {
                fs.unlinkSync(tempIn);
                reject(err);
            })
            .save(tempOut);
    });
}

router.post("/", upload.single("voice"), async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: "Missing name" });
        if (!req.file) return res.status(400).json({ error: "No audio uploaded" });

        // convert incoming audio to wav
        const wavPath = await bufferToWav(req.file.buffer);

        // send to FastAPI
        const form = new FormData();
        form.append("file", fs.createReadStream(wavPath), "voice.wav");

        const AI_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000/analyze-voice";
        const ai = await axios.post(AI_URL, form, { headers: form.getHeaders() });

        const features = ai.data?.features;
        if (!features) return res.status(500).json({ error: "AI didn't send features" });

        // find existing user
        let user = await User.findOne({ username: name });

        if (!user) {
            user = new User({
                username: name,
                recordings: [],
                avg_features: features
            });
        }

        user.recordings.push({
            file_id: uuidv4(),
            created_at: new Date(),
            features
        });

        // recompute avg_features
        const all = user.recordings.map(r => r.features);
        const k = all.length;
        const dim = all[0].length;

        const avg = new Array(dim).fill(0);
        for (let vec of all) {
            for (let i = 0; i < dim; i++) avg[i] += vec[i];
        }
        for (let i = 0; i < dim; i++) avg[i] /= k;

        user.avg_features = avg;

        await user.save();

        fs.unlinkSync(wavPath);

        return res.json({ message: "Registered" });

    } catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({ error: "Register failed" });
    }
});

export default router;
