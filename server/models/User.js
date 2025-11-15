// server/models/User.js
import mongoose from "mongoose";

const recordingSchema = new mongoose.Schema({
  features: { type: [Number], required: true },
  createdAt: { type: Date, default: Date.now },
  note: String
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  recordings: { type: [recordingSchema], default: [] },
});

const User = mongoose.model("User", userSchema);
export default User;
