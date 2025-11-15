// server/routes/admin.js
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

function adminAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: "Unauthorized" });
  const token = h.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    if (payload.role !== "admin") return res.status(403).json({ error: "Admin only" });
    req.admin = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

router.get("/users", adminAuth, async (req, res) => {
  const users = await User.find({}).select("username recordings").lean();
  // for safety: do not return raw features arrays in large apps; here it's fine
  res.json(users);
});

router.get("/user-count", adminAuth, async (req, res) => {
  const c = await User.countDocuments();
  res.json({ count: c });
});

// public lightweight count (for client without admin token)
router.get("/public-count", async (req, res) => {
  const c = await User.countDocuments();
  res.json({ count: c });
});

export default router;
