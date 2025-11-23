'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('favorites', {
      favorite_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      
      // Universal fields for any favorited item
      item_type: {
        type: Sequelize.ENUM('hotel', 'place', 'itinerary', 'activity', 'restaurant', 'attraction', 'trip'),
        allowNull: false
      },
      item_id: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'External ID (e.g., Booking.com hotel_id) or internal ID'
      },
      
      // Cached item details
      item_name: {
        type: Sequelize.STRING(300),
        allowNull: true
      },
      item_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      item_image_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      item_location: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      item_data: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Flexible storage for any additional data'
      },
      
      // Metadata
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'User personal notes about this favorite'
      },
      tags: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Comma-separated tags for organization'
      },
      saved_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint for user_id + item_type + item_id
    await queryInterface.addConstraint('favorites', {
      fields: ['user_id', 'item_type', 'item_id'],
      type: 'unique',
      name: 'unique_user_item'
    });

    // Add indexes for performance
    await queryInterface.addIndex('favorites', ['user_id'], {
      name: 'favorites_user_id_index'
    });
    
    await queryInterface.addIndex('favorites', ['item_type'], {
      name: 'favorites_item_type_index'
    });
    
    await queryInterface.addIndex('favorites', ['user_id', 'item_type'], {
      name: 'favorites_user_type_index'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('favorites');
  }
};
