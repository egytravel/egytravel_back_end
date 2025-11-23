// Database models and associations
const sequelize = require('../../config/database');
const User = require('./User');
const PasswordResetToken = require('./PasswordResetToken');
const Trip = require('./Trip');
const Booking = require('./Booking');
const Favorite = require('./Favorite');

// Define associations

// User associations
User.hasMany(PasswordResetToken, {
  foreignKey: 'user_id',
  as: 'passwordResetTokens',
  onDelete: 'CASCADE'
});

User.hasMany(Trip, {
  foreignKey: 'user_id',
  as: 'trips',
  onDelete: 'CASCADE'
});

User.hasMany(Booking, {
  foreignKey: 'user_id',
  as: 'bookings',
  onDelete: 'CASCADE'
});

User.hasMany(Favorite, {
  foreignKey: 'user_id',
  as: 'favorites',
  onDelete: 'CASCADE'
});

// PasswordResetToken associations
PasswordResetToken.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE'
});

// Trip associations
Trip.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE'
});

Trip.hasMany(Booking, {
  foreignKey: 'trip_id',
  as: 'bookings',
  onDelete: 'SET NULL'
});

// Booking associations
Booking.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE'
});

Booking.belongsTo(Trip, {
  foreignKey: 'trip_id',
  as: 'trip',
  onDelete: 'SET NULL'
});

// Favorite associations
Favorite.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE'
});

// Sync database (create tables if they don't exist)
const syncDatabase = async (force = false) => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    await sequelize.sync({ force });
    console.log('Database synchronized successfully.');
    
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  PasswordResetToken,
  Trip,
  Booking,
  Favorite,
  syncDatabase
};