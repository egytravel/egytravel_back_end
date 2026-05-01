const mongoose = require('mongoose');

const placeCacheSchema = new mongoose.Schema({
  cacheKey: { type: String, required: true, unique: true, index: true },
  source: { type: String, enum: ['opentripmap', 'wikipedia', 'google', 'booking'], required: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } } // TTL index
}, {
  timestamps: true,
  collection: 'place_cache'
});

module.exports = mongoose.model('PlaceCache', placeCacheSchema);
