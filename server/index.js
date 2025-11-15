// server/index.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import registerRoute from "./routes/register.js";
import verifyRoute from "./routes/verify.js";
import adminRoute from "./routes/admin.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => res.json({ status: "backend up" }));

app.use("/api/auth", authRoutes);
app.use("/api/register", registerRoute);
app.use("/api/verify", verifyRoute);
app.use("/api/admin", adminRoute);

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { });
    console.log("✅ MongoDB connected");
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Node backend running on port ${PORT}`);
      console.log(`🧠 FastAPI feature URL (set in .env): ${process.env.AI_SERVICE_URL}`);
    });
  } catch (e) {
    console.error("MongoDB connection error:", e.message);
    process.exit(1);
  }
})();
