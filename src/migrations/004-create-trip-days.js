'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('trip_days', {
      day_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      trip_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'trips',
          key: 'trip_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      day_number: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      activities: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of activities for the day'
      },
      locations: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of locations to visit'
      },
      budget: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint for trip_id + day_number
    await queryInterface.addConstraint('trip_days', {
      fields: ['trip_id', 'day_number'],
      type: 'unique',
      name: 'unique_trip_day'
    });

    // Add indexes for performance
    await queryInterface.addIndex('trip_days', ['trip_id'], {
      name: 'trip_days_trip_id_index'
    });
    
    await queryInterface.addIndex('trip_days', ['date'], {
      name: 'trip_days_date_index'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('trip_days');
  }
};
