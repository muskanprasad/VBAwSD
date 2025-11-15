import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },

  // store hashed password here
  password: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },

  recordings: [
    {
      file_id: String,
      cleaned_url: String,
      created_at: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

export default mongoose.model("User", UserSchema);
