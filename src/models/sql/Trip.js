const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Trip = sequelize.define('Trip', {
  trip_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  destination: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('planning', 'confirmed', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'planning'
  },
  cover_image: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  interests: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of interest tags e.g. ["Historical", "Beaches"]'
  },
  source: {
    type: DataTypes.ENUM('manual', 'ai'),
    allowNull: false,
    defaultValue: 'manual'
  }
}, {
  tableName: 'trips',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Instance methods
Trip.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Convert snake_case to camelCase for API responses
  values.tripId = values.trip_id;
  values.userId = values.user_id;
  values.startDate = values.start_date;
  values.endDate = values.end_date;
  values.createdAt = values.created_at;
  values.updatedAt = values.updated_at;
  
  // Remove snake_case fields
  delete values.trip_id;
  delete values.user_id;
  delete values.start_date;
  delete values.end_date;
  delete values.created_at;
  delete values.updated_at;
  
  return values;
};

module.exports = Trip;
