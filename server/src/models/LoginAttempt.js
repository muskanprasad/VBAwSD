const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema({
  username: { type: String, required: true },
  success: { type: Boolean, required: true },
  similarityScore: { type: Number, default: null },
  spoofScore: { type: Number, default: null },
  reason: { type: String, default: '' }
}, { timestamps: { createdAt: 'time' } });

module.exports = mongoose.model('LoginAttempt', loginAttemptSchema);
