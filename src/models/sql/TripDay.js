const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const TripDay = sequelize.define('TripDay', {
  day_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  trip_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'trips', key: 'trip_id' }
  },
  day_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Array of strings e.g. ["Visit Pyramids", "Lunch at Khan el-Khalili"]
  activities: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  // Array of objects e.g. [{ name: "Pyramids of Giza", lat: 29.97, lng: 31.13 }]
  locations: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'trip_days',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

TripDay.prototype.toJSON = function () {
  const v = Object.assign({}, this.get());
  v.dayId     = v.day_id;
  v.tripId    = v.trip_id;
  v.dayNumber = v.day_number;
  v.createdAt = v.created_at;
  v.updatedAt = v.updated_at;
  delete v.day_id;
  delete v.trip_id;
  delete v.day_number;
  delete v.created_at;
  delete v.updated_at;
  return v;
};

module.exports = TripDay;
