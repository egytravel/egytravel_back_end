const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  userId: { type: Number, index: true },          // null for anonymous
  sessionId: { type: String },                     // for anonymous tracking
  query: { type: String, required: true },
  type: { type: String, enum: ['place', 'hotel', 'flight', 'destination', 'general'], default: 'general' },
  resultsCount: { type: Number, default: 0 },
  clickedItemId: { type: String },                 // what they tapped after searching
  clickedItemType: { type: String }
}, {
  timestamps: true,
  collection: 'search_history'
});

searchHistorySchema.index({ userId: 1, createdAt: -1 });
searchHistorySchema.index({ query: 'text' });      // text search on queries

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
