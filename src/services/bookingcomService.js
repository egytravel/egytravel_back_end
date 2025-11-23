const axios = require('axios');
const bookingConfig = require('../config/bookingcom');
const logger = require('../utils/logger');

class BookingcomService {
  constructor() {
    this.baseURL = bookingConfig.apiBaseUrl;
    this.timeout = bookingConfig.timeout;
    this.retryAttempts = bookingConfig.retryAttempts;
    this.retryDelay = bookingConfig.retryDelay;
    
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      auth: {
        username: bookingConfig.username,
        password: bookingConfig.password
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Make API request with retry logic
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {object} params - Query parameters
   * @param {number} attempt - Current attempt number
   * @returns {Promise<object>} API response data
   */
  async makeRequest(method, endpoint, params = {}, attempt = 1) {
    try {
      logger.info(`Booking.com API ${method} ${endpoint}`, { params, attempt });
      
      const response = await this.client.request({
        method,
        url: endpoint,
        params
      });
      
      logger.info(`Booking.com API ${method} ${endpoint} - Success`, {
        status: response.status
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Booking.com API ${method} ${endpoint} - Error`, {
        attempt,
        error: error.message,
        status: error.response?.status
      });
      
      // Retry logic for network errors
      if (attempt < this.retryAttempts && this.shouldRetry(error)) {
        logger.info(`Retrying request (attempt ${attempt + 1}/${this.retryAttempts})`);
        await this.delay(this.retryDelay * attempt); // Exponential backoff
        return this.makeRequest(method, endpoint, params, attempt + 1);
      }
      
      throw this.handleError(error);
    }
  }

  /**
   * Determine if request should be retried
   * @param {Error} error - Error object
   * @returns {boolean} Should retry
   */
  shouldRetry(error) {
    // Retry on network errors or 5xx server errors
    return (
      !error.response || 
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      (error.response && error.response.status >= 500)
    );
  }

  /**
   * Delay helper for retry logic
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle and format API errors
   * @param {Error} error - Error object
   * @returns {Error} Formatted error
   */
  handleError(error) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      const timeoutError = new Error('Booking.com API request timeout');
      timeoutError.code = 'API_TIMEOUT';
      timeoutError.statusCode = 504;
      return timeoutError;
    }
    
    if (!error.response) {
      const networkError = new Error('Booking.com API is unavailable');
      networkError.code = 'API_UNAVAILABLE';
      networkError.statusCode = 503;
      return networkError;
    }
    
    const apiError = new Error(
      error.response.data?.message || 'Booking.com API error'
    );
    apiError.code = 'API_ERROR';
    apiError.statusCode = error.response.status;
    apiError.details = error.response.data;
    return apiError;
  }

  /**
   * Search for hotels
   * @param {object} searchParams - Search parameters
   * @param {string} searchParams.location - Location/city name or ID
   * @param {string} searchParams.checkin - Check-in date (YYYY-MM-DD)
   * @param {string} searchParams.checkout - Check-out date (YYYY-MM-DD)
   * @param {number} searchParams.guests - Number of guests
   * @param {number} searchParams.rooms - Number of rooms
   * @returns {Promise<Array>} Array of hotel results
   */
  async searchHotels({ location, checkin, checkout, guests = 2, rooms = 1 }) {
    try {
      // Check if we have valid API credentials
      if (!bookingConfig.username || bookingConfig.username === 'your-booking-api-username') {
        logger.warn('Using mock hotel data - Booking.com API not configured');
        return this.getMockHotelSearchResults(location, checkin, checkout, guests, rooms);
      }
      
      const params = {
        city_ids: location, // In production, you'd convert city name to ID
        checkin,
        checkout,
        guest_qty: guests,
        room_qty: rooms,
        extras: 'hotel_photos,hotel_description,hotel_facilities'
      };
      
      const data = await this.makeRequest('GET', '/hotels', params);
      
      // Format response to match our API structure
      return this.formatHotelSearchResults(data);
    } catch (error) {
      logger.error('Hotel search failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get hotel details by ID
   * @param {string} hotelId - Hotel ID
   * @param {object} params - Additional parameters
   * @param {string} params.checkin - Check-in date
   * @param {string} params.checkout - Check-out date
   * @param {number} params.guests - Number of guests
   * @param {number} params.rooms - Number of rooms
   * @returns {Promise<object>} Hotel details
   */
  async getHotelDetails(hotelId, { checkin, checkout, guests = 2, rooms = 1 }) {
    try {
      // Check if we have valid API credentials
      if (!bookingConfig.username || bookingConfig.username === 'your-booking-api-username') {
        logger.warn('Using mock hotel data - Booking.com API not configured');
        return this.getMockHotelDetails(hotelId, checkin, checkout, guests, rooms);
      }
      
      const params = {
        hotel_ids: hotelId,
        checkin,
        checkout,
        guest_qty: guests,
        room_qty: rooms,
        extras: 'hotel_photos,hotel_description,hotel_facilities,hotel_info,room_info'
      };
      
      const data = await this.makeRequest('GET', `/hotels/${hotelId}`, params);
      
      // Format response to match our API structure
      return this.formatHotelDetails(data);
    } catch (error) {
      logger.error('Get hotel details failed', { hotelId, error: error.message });
      throw error;
    }
  }

  /**
   * Format hotel search results
   * @param {object} data - Raw API response
   * @returns {Array} Formatted hotel results
   */
  formatHotelSearchResults(data) {
    // This is a placeholder - actual format depends on Booking.com API response
    // In production, you'd parse the actual API response structure
    if (!data || !Array.isArray(data.result)) {
      return [];
    }
    
    return data.result.map(hotel => ({
      hotelId: hotel.hotel_id,
      name: hotel.hotel_name,
      location: hotel.city,
      address: hotel.address,
      rating: hotel.review_score || 0,
      reviewCount: hotel.review_nr || 0,
      price: {
        amount: hotel.min_total_price || 0,
        currency: hotel.currency_code || 'USD',
        perNight: true
      },
      mainImage: hotel.main_photo_url || hotel.photos?.[0]?.url_max || '',
      amenities: hotel.hotel_facilities || [],
      coordinates: {
        latitude: hotel.latitude,
        longitude: hotel.longitude
      }
    }));
  }

  /**
   * Format hotel details
   * @param {object} data - Raw API response
   * @returns {object} Formatted hotel details
   */
  formatHotelDetails(data) {
    // This is a placeholder - actual format depends on Booking.com API response
    if (!data || !data.result) {
      throw new Error('Hotel not found');
    }
    
    const hotel = data.result[0] || data.result;
    
    return {
      hotelId: hotel.hotel_id,
      name: hotel.hotel_name,
      location: hotel.city,
      address: hotel.address,
      fullAddress: `${hotel.address}, ${hotel.city}, ${hotel.country}`,
      description: hotel.hotel_description || '',
      rating: hotel.review_score || 0,
      reviewCount: hotel.review_nr || 0,
      price: {
        amount: hotel.min_total_price || 0,
        currency: hotel.currency_code || 'USD',
        perNight: true
      },
      images: hotel.photos?.map(photo => photo.url_max) || [],
      amenities: hotel.hotel_facilities || [],
      rooms: hotel.rooms || [],
      coordinates: {
        latitude: hotel.latitude,
        longitude: hotel.longitude
      },
      checkInTime: hotel.checkin?.from || '14:00',
      checkOutTime: hotel.checkout?.until || '12:00'
    };
  }
}

// Export singleton instance
module.exports = new BookingcomService();
