// Booking.com API configuration
require('dotenv').config();

const bookingConfig = {
  // API Base URL
  apiBaseUrl: process.env.BOOKING_API_BASE_URL || 'https://distribution-xml.booking.com/2.7/json',
  
  // API Credentials
  username: process.env.BOOKING_API_USERNAME,
  password: process.env.BOOKING_API_PASSWORD,
  
  // Affiliate ID for commission tracking
  affiliateId: process.env.BOOKING_AFFILIATE_ID,
  
  // API Request Configuration
  timeout: parseInt(process.env.API_TIMEOUT) || 30000, // 30 seconds
  retryAttempts: parseInt(process.env.API_RETRY_ATTEMPTS) || 2,
  retryDelay: parseInt(process.env.API_RETRY_DELAY) || 1000, // 1 second
  
  // Cache Configuration
  cache: {
    searchTTL: parseInt(process.env.CACHE_TTL_SEARCH) || 3600, // 1 hour
    hotelTTL: parseInt(process.env.CACHE_TTL_HOTEL) || 7200, // 2 hours
    locationTTL: parseInt(process.env.CACHE_TTL_LOCATION) || 86400 // 24 hours
  },
  
  // Validate configuration
  isValid() {
    if (!this.username || !this.password) {
      console.warn('⚠️  Booking.com API credentials not configured');
      return false;
    }
    if (!this.affiliateId) {
      console.warn('⚠️  Booking.com affiliate ID not configured');
      return false;
    }
    return true;
  }
};

// Log configuration status on load
if (bookingConfig.isValid()) {
  console.log('✓ Booking.com API configuration loaded');
} else {
  console.error('✗ Booking.com API configuration incomplete - check environment variables');
}

module.exports = bookingConfig;
