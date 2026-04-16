const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const PostLike = sequelize.define('PostLike', {
  like_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'posts', key: 'post_id' }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'user_id' }
  }
}, {
  tableName: 'post_likes',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { unique: true, fields: ['post_id', 'user_id'], name: 'unique_post_like' }
  ]
});

module.exports = PostLike;
