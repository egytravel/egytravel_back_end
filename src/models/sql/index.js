// Database models and associations
const sequelize = require('../../config/database');
const User = require('./User');
const PasswordResetToken = require('./PasswordResetToken');
const Trip = require('./Trip');
const Booking = require('./Booking');
const Favorite = require('./Favorite');
const Review = require('./Review');
const Post = require('./Post');
const PostLike = require('./PostLike');
const PostComment = require('./PostComment');

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

// Review associations
Review.belongsTo(User, { foreignKey: 'user_id', as: 'user', onDelete: 'CASCADE' });
User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews', onDelete: 'CASCADE' });

// Post associations
Post.belongsTo(User, { foreignKey: 'user_id', as: 'author', onDelete: 'CASCADE' });
User.hasMany(Post, { foreignKey: 'user_id', as: 'posts', onDelete: 'CASCADE' });

Post.hasMany(PostLike, { foreignKey: 'post_id', as: 'likes', onDelete: 'CASCADE' });
PostLike.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });
PostLike.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Post.hasMany(PostComment, { foreignKey: 'post_id', as: 'comments', onDelete: 'CASCADE' });
PostComment.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });
PostComment.belongsTo(User, { foreignKey: 'user_id', as: 'author', onDelete: 'CASCADE' });

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
  sequelize, User, PasswordResetToken, Trip, Booking,
  Favorite, Review, Post, PostLike, PostComment, syncDatabase
};