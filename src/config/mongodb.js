// MongoDB Mongoose configuration
const mongoose = require('mongoose');
require('dotenv').config();

const connectMongoDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.log('MongoDB URI not provided, skipping MongoDB connection');
      return null;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't exit process, allow app to continue with MySQL only
    return null;
  }
};

module.exports = connectMongoDB;