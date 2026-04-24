const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Booking = sequelize.define('Booking', {
  booking_id: {
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
  trip_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'trips',
      key: 'trip_id'
    }
  },
  
  // Universal booking type
  booking_type: {
    type: DataTypes.ENUM('hotel', 'flight', 'activity', 'transport'),
    allowNull: false,
    defaultValue: 'hotel'
  },
  
  // Common fields for all booking types
  provider: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'Amadeus'
  },
  booking_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Affiliate/redirect link to provider'
  },
  booking_reference: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Confirmation number from provider'
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD'
  },
  
  // Hotel-specific fields
  hotel_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  hotel_name: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  hotel_location: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  hotel_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  check_in_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'check_in_date'
  },
  check_out_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'check_out_date'
  },
  guests: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  rooms: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  
  // Flight-specific fields
  flight_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  airline: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  flight_number: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  departure_airport: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  arrival_airport: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  departure_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  arrival_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  departure_city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  arrival_city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  passengers: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  cabin_class: {
    type: DataTypes.ENUM('economy', 'premium_economy', 'business', 'first'),
    allowNull: true
  },
  baggage_info: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  
  // Flexible storage for any additional data
  booking_data: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional provider-specific data'
  },
  
  // User notes
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'bookings',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Instance methods
Booking.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Format dates for JSON response
  if (values.check_in_date) {
    values.checkInDate = values.check_in_date;
    delete values.check_in_date;
  }
  if (values.check_out_date) {
    values.checkOutDate = values.check_out_date;
    delete values.check_out_date;
  }
  
  // Convert snake_case to camelCase for API responses
  values.bookingId = values.booking_id;
  values.userId = values.user_id;
  values.tripId = values.trip_id;
  values.bookingType = values.booking_type;
  values.bookingUrl = values.booking_url;
  values.bookingReference = values.booking_reference;
  values.totalPrice = values.total_price;
  values.hotelId = values.hotel_id;
  values.hotelName = values.hotel_name;
  values.hotelLocation = values.hotel_location;
  values.hotelAddress = values.hotel_address;
  values.bookingData = values.booking_data;
  values.createdAt = values.created_at;
  values.updatedAt = values.updated_at;
  
  // Remove snake_case fields
  delete values.booking_id;
  delete values.user_id;
  delete values.trip_id;
  delete values.booking_type;
  delete values.booking_url;
  delete values.booking_reference;
  delete values.total_price;
  delete values.hotel_id;
  delete values.hotel_name;
  delete values.hotel_location;
  delete values.hotel_address;
  delete values.booking_data;
  delete values.created_at;
  delete values.updated_at;
  
  return values;
};

module.exports = Booking;
