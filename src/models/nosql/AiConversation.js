const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const aiConversationSchema = new mongoose.Schema({
  userId: { type: Number, required: true, index: true },
  sessionId: { type: String, required: true, unique: true },
  messages: [messageSchema],
  context: { type: String },             // e.g. "trip_planner" or "chat_assistant"
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'ai_conversations'
});

aiConversationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AiConversation', aiConversationSchema);
