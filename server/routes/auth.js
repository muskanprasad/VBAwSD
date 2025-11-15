// server/routes/auth.js
import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Admin login (hardcoded from .env)
router.post("/admin-login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "Username & password required" });

    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
      const token = jwt.sign({ role: "admin", username }, process.env.JWT_SECRET || "dev-secret", { expiresIn: "8h" });
      return res.json({ token, role: "admin", username });
    }

    return res.status(401).json({ error: "Invalid admin credentials" });
  } catch (e) {
    console.error("Admin login error:", e);
    return res.status(500).json({ error: "Login failed" });
  }
});

export default router;
