const mongoose = require('mongoose');

const emailOTPSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, index: true },
  otp: { type: String, required: true },
  type: { type: String, enum: ['registration', 'password_reset'], required: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  verified: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 }
}, {
  timestamps: true,
  collection: 'email_otps'
});

emailOTPSchema.index({ email: 1, type: 1 });

module.exports = mongoose.model('EmailOTP', emailOTPSchema);
