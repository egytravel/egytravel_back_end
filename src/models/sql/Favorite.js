const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Favorite = sequelize.define('Favorite', {
  favorite_id: {
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
  item_type: {
    type: DataTypes.ENUM('hotel', 'place', 'destination', 'itinerary', 'activity', 'restaurant', 'attraction', 'trip'),
    allowNull: false,
    comment: 'Type of item being favorited'
  },
  item_id: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'External ID of the favorited item'
  },
  item_name: {
    type: DataTypes.STRING(300),
    allowNull: true
  },
  item_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  item_image_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  item_location: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  item_data: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional item-specific data (pricing, amenities, etc.)'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User notes about this favorite'
  },
  tags: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Comma-separated tags for organization'
  },
  saved_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'favorites',
  underscored: true,
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'item_type', 'item_id'],
      name: 'unique_user_item'
    }
  ]
});

// Instance methods
Favorite.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Convert snake_case to camelCase for API responses
  values.favoriteId = values.favorite_id;
  values.userId = values.user_id;
  values.itemType = values.item_type;
  values.itemId = values.item_id;
  values.itemName = values.item_name;
  values.itemDescription = values.item_description;
  values.itemImageUrl = values.item_image_url;
  values.itemLocation = values.item_location;
  values.itemData = values.item_data;
  values.savedAt = values.saved_at;
  
  // Remove snake_case fields
  delete values.favorite_id;
  delete values.user_id;
  delete values.item_type;
  delete values.item_id;
  delete values.item_name;
  delete values.item_description;
  delete values.item_image_url;
  delete values.item_location;
  delete values.item_data;
  delete values.saved_at;
  
  return values;
};

module.exports = Favorite;
