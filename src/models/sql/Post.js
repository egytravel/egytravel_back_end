const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Post = sequelize.define('Post', {
  post_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'user_id' }
  },
  // Optional place tag
  place_id: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Our internal place/destination ID'
  },
  place_name: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  place_type: {
    type: DataTypes.ENUM('destination', 'place', 'restaurant', 'hotel', 'city'),
    allowNull: true
  },
  // Content
  caption: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of image URLs'
  },
  // Stats
  likes_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  comments_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Visit info
  visit_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
    validate: { min: 1, max: 5 }
  }
}, {
  tableName: 'posts',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Post;
