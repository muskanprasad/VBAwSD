// server/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import registerRoute from "./routes/register.js";
import verifyRoute from "./routes/verify.js";
import adminRoute from "./routes/admin.js";
import authRoute from "./routes/auth.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("Mongo failed", err));

// Public endpoint — user count
import User from "./models/User.js";
app.get("/api/user-count", async (req, res) => {
    const count = await User.countDocuments();
    res.json({ count });
});

// Routes
app.use("/api/register", registerRoute);   // POST
app.use("/api/verify", verifyRoute);       // POST
app.use("/api/admin", adminRoute);         // GET users, DELETE user
app.use("/api/auth", authRoute);           // signup/login

// Root
app.get("/", (req, res) => res.send("VoiceAuth Node Server Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Node backend running on port ${PORT}`);
    console.log("🧠 FastAPI feature URL:", process.env.AI_SERVICE_URL);
});
