// server/routes/admin.js
import express from "express";
import authMiddleware from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/users", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });

    const users = await User.find({}, { username: 1, recordings: 1 }).lean();
    res.json({ users });
  } catch (err) {
    console.error("Admin fetch users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.delete("/user/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Admin delete error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;
