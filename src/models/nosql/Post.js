const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  authorName: { type: String, required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  userId: { type: Number, required: true, index: true },
  authorName: { type: String, required: true },
  caption: { type: String, required: true },
  images: [{ type: String }],
  placeId: { type: String, index: true },
  placeName: { type: String },
  placeType: { type: String, enum: ['destination', 'place', 'restaurant', 'hotel', 'city'] },
  rating: { type: Number, min: 1, max: 5 },
  visitDate: { type: Date },
  likesCount: { type: Number, default: 0 },
  likedBy: [{ type: Number }],          // array of userIds who liked
  comments: [commentSchema],
  commentsCount: { type: Number, default: 0 }
}, {
  timestamps: true,
  collection: 'posts'
});

postSchema.index({ createdAt: -1 });
postSchema.index({ placeId: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
