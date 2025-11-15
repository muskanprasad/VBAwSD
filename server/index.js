// server/index.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import authRoutes from "./routes/auth.js";
import registerRoute from "./routes/register.js";
import verifyRoute from "./routes/verify.js";
import adminRoutes from "./routes/admin.js";

import User from "./models/User.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Connect MongoDB
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI, {
  // modern driver options are default
}).then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err.message));

const PORT = process.env.PORT || 5000;

app.use("/api/auth", authRoutes);
app.use("/api", registerRoute); // /api/register
app.use("/api", verifyRoute);   // /api/verify
app.use("/api/admin", adminRoutes);

// convenient user-count endpoint
app.get("/api/user-count", async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error("Error counting users:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/", (req, res) => res.send("Node backend running 🚀"));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Node backend running on port ${PORT}`);
  console.log(`🧠 FastAPI feature URL (set in .env): ${process.env.AI_SERVICE_URL}`);
});
