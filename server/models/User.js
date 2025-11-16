// server/models/User.js
import mongoose from "mongoose";

const RecordingSchema = new mongoose.Schema({
    file_id: String,
    created_at: Date,
    features: [Number]
});

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    role: { type: String, default: "user" },

    recordings: { type: [RecordingSchema], default: [] },
    avg_features: { type: [Number], default: [] },

    passwordHash: { type: String, required: false }, // For auth
});

const User = mongoose.model("User", UserSchema);
export default User;
