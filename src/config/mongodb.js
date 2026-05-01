// MongoDB Mongoose configuration
const mongoose = require('mongoose');
require('dotenv').config();

const connectMongoDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.log('MongoDB URI not provided, skipping MongoDB connection');
      return null;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log('📦 MongoDB collections: posts, reviews, ai_conversations, ai_trip_plans, place_cache, search_history');
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    return null;
  }
};

module.exports = connectMongoDB;