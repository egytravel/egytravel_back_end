const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Review = sequelize.define('Review', {
  review_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'user_id' }
  },
  place_id: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Our internal destination/place ID'
  },
  place_type: {
    type: DataTypes.ENUM('destination', 'place', 'restaurant', 'hotel'),
    allowNull: false,
    defaultValue: 'destination'
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of image URLs uploaded by user'
  },
  likes_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  visit_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  }
}, {
  tableName: 'reviews',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Review;
