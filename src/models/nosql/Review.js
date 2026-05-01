const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: { type: Number, required: true, index: true },
  authorName: { type: String, required: true },
  placeId: { type: String, required: true, index: true },
  placeType: { type: String, enum: ['destination', 'place', 'restaurant', 'hotel'], default: 'destination' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String },
  comment: { type: String, required: true },
  images: [{ type: String }],
  visitDate: { type: Date },
  likesCount: { type: Number, default: 0 }
}, {
  timestamps: true,
  collection: 'reviews'
});

// Prevent duplicate reviews from same user for same place
reviewSchema.index({ userId: 1, placeId: 1, placeType: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
