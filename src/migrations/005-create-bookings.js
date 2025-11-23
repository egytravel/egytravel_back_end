'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('bookings', {
      booking_id: {
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
      trip_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'trips',
          key: 'trip_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      
      // Universal booking type
      booking_type: {
        type: Sequelize.ENUM('hotel', 'flight', 'activity', 'transport'),
        allowNull: false
      },
      
      // Common fields for all booking types
      provider: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'e.g., Booking.com, Skyscanner, Expedia'
      },
      booking_url: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Affiliate/redirect link to provider'
      },
      booking_reference: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: 'Confirmation number from provider'
      },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
        allowNull: false,
        defaultValue: 'pending'
      },
      total_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'USD'
      },
      
      // Hotel-specific fields
      hotel_id: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      hotel_name: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      hotel_location: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      hotel_address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      check_in_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      check_out_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      guests: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      rooms: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      
      // Flight-specific fields
      flight_id: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      airline: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      flight_number: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      departure_airport: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      arrival_airport: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      departure_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      arrival_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      departure_city: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      arrival_city: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      passengers: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      cabin_class: {
        type: Sequelize.ENUM('economy', 'premium_economy', 'business', 'first'),
        allowNull: true
      },
      baggage_info: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      
      // Flexible storage for any additional data
      booking_data: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional provider-specific data'
      },
      
      // User notes
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      
      // Metadata
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

    // Add indexes for performance
    await queryInterface.addIndex('bookings', ['user_id'], {
      name: 'bookings_user_id_index'
    });
    
    await queryInterface.addIndex('bookings', ['trip_id'], {
      name: 'bookings_trip_id_index'
    });
    
    await queryInterface.addIndex('bookings', ['booking_type'], {
      name: 'bookings_booking_type_index'
    });
    
    await queryInterface.addIndex('bookings', ['status'], {
      name: 'bookings_status_index'
    });
    
    await queryInterface.addIndex('bookings', ['check_in_date'], {
      name: 'bookings_check_in_date_index'
    });
    
    await queryInterface.addIndex('bookings', ['departure_date'], {
      name: 'bookings_departure_date_index'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('bookings');
  }
};
