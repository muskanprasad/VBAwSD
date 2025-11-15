import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function cleanup() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Delete users with empty or invalid voiceFeatures
    const result = await User.deleteMany({
      $or: [
        { voiceFeatures: { $exists: false } },
        { voiceFeatures: { $size: 0 } },
      ],
    });

    console.log(`🧹 Deleted ${result.deletedCount} invalid users`);
    console.log("✨ Cleanup complete");
  } catch (err) {
    console.error("❌ Error cleaning up:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

cleanup();
