const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Place = sequelize.define('Place', {
  place_id:     { type: DataTypes.STRING(50), primaryKey: true },
  name:         { type: DataTypes.STRING(300), allowNull: false },
  category:     { type: DataTypes.STRING(100) },
  kinds:        { type: DataTypes.TEXT },
  lat:          { type: DataTypes.DECIMAL(10, 7) },
  lng:          { type: DataTypes.DECIMAL(10, 7) },
  cover_image:  { type: DataTypes.TEXT },
  description:  { type: DataTypes.TEXT },
  rating:       { type: DataTypes.DECIMAL(4, 1) },
  address:      { type: DataTypes.TEXT },
  city:         { type: DataTypes.STRING(100) },
  wikipedia_url:{ type: DataTypes.TEXT },
  source:       { type: DataTypes.STRING(50), defaultValue: 'opentripmap' }
}, {
  tableName: 'places',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Place;
