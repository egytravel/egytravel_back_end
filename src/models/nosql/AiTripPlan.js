const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  time: String,
  activity: String,
  location: String,
  lat: Number,
  lng: Number,
  type: { type: String, enum: ['attraction', 'restaurant', 'hotel', 'transport', 'other'] },
  notes: String
}, { _id: false });

const daySchema = new mongoose.Schema({
  dayNumber: Number,
  date: Date,
  hotel: mongoose.Schema.Types.Mixed,
  flight: mongoose.Schema.Types.Mixed,
  activities: [activitySchema]
}, { _id: false });

const aiTripPlanSchema = new mongoose.Schema({
  userId: { type: Number, required: true, index: true },
  destination: { type: String, required: true },
  startDate: Date,
  endDate: Date,
  days: Number,
  budget: String,
  interests: [String],
  plan: {                                // raw AI response stored as-is
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  structuredDays: [daySchema],           // parsed/structured version
  estimatedBudget: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'USD' }
  },
  isSaved: { type: Boolean, default: false },
  title: String
}, {
  timestamps: true,
  collection: 'ai_trip_plans'
});

aiTripPlanSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AiTripPlan', aiTripPlanSchema);
