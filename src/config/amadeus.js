// Amadeus API configuration
require('dotenv').config();

const amadeusConfig = {
  // API Base URL
  apiBaseUrl: process.env.AMADEUS_API_BASE_URL || 'https://test.api.amadeus.com',
  
  // API Credentials
  apiKey: process.env.AMADEUS_API_KEY,
  apiSecret: process.env.AMADEUS_API_SECRET,
  
  // API Request Configuration
  timeout: parseInt(process.env.API_TIMEOUT) || 30000, // 30 seconds
  retryAttempts: parseInt(process.env.API_RETRY_ATTEMPTS) || 2,
  retryDelay: parseInt(process.env.API_RETRY_DELAY) || 1000, // 1 second
  
  // Cache Configuration
  cache: {
    searchTTL: parseInt(process.env.CACHE_TTL_SEARCH) || 3600, // 1 hour
    hotelTTL: parseInt(process.env.CACHE_TTL_HOTEL) || 7200, // 2 hours
    flightTTL: parseInt(process.env.CACHE_TTL_FLIGHT) || 1800, // 30 minutes
    locationTTL: parseInt(process.env.CACHE_TTL_LOCATION) || 86400 // 24 hours
  },
  
  // Validate configuration
  isValid() {
    if (!this.apiKey || !this.apiSecret) {
      console.warn('⚠️  Amadeus API credentials not configured');
      return false;
    }
    return true;
  }
};

// Log configuration status on load
if (amadeusConfig.isValid()) {
  console.log('✓ Amadeus API configuration loaded');
} else {
  console.error('✗ Amadeus API configuration incomplete - check environment variables');
}

module.exports = amadeusConfig;
