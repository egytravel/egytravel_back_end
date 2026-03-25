const Amadeus = require('amadeus');
const amadeusConfig = require('../config/amadeus');
const logger = require('../utils/logger');

class AmadeusService {
  constructor() {
    // Check if credentials are available
    if (!amadeusConfig.apiKey || !amadeusConfig.apiSecret) {
      logger.warn('Amadeus API credentials not configured');
      this.client = null;
      return;
    }

    try {
      // Initialize Amadeus client - use 'new' keyword
      this.client = new Amadeus({
        clientId: amadeusConfig.apiKey,
        clientSecret: amadeusConfig.apiSecret,
        hostname: amadeusConfig.apiBaseUrl.includes('test') ? 'test' : 'production',
        logLevel: 'silent' // Reduce noise in logs
      });
      
      this.timeout = amadeusConfig.timeout;
      this.retryAttempts = amadeusConfig.retryAttempts;
      this.retryDelay = amadeusConfig.retryDelay;
      
      logger.info('Amadeus service initialized successfully', {
        hostname: amadeusConfig.apiBaseUrl.includes('test') ? 'test' : 'production',
        hasClient: !!this.client
      });
    } catch (error) {
      logger.error('Failed to initialize Amadeus service', { error: error.message, stack: error.stack });
      this.client = null;
    }
  }

  /**
   * Search for hotels by city
   * @param {object} params - Search parameters
   * @param {string} params.cityCode - IATA city code (e.g., CAI for Cairo)
   * @param {string} params.checkin - Check-in date (YYYY-MM-DD)
   * @param {string} params.checkout - Check-out date (YYYY-MM-DD)
   * @param {number} params.adults - Number of adults
   * @param {number} params.rooms - Number of rooms
   * @returns {Promise<Array>} Array of hotel results
   */
  async searchHotels({ cityCode, checkin, checkout, adults = 2, rooms = 1 }) {
    try {
      if (!this.client) {
        throw new Error('Amadeus client not initialized. Check API credentials.');
      }

      logger.info('Amadeus hotel search', { cityCode, checkin, checkout, adults });
      
      // Step 1: Get hotel IDs in the city
      const hotelsResponse = await this.client.referenceData.locations.hotels.byCity.get({
        cityCode: cityCode
      });
      
      if (!hotelsResponse.data || hotelsResponse.data.length === 0) {
        logger.info('No hotels found in city', { cityCode });
        return [];
      }
      
      // Get first 10 hotel IDs
      const hotelIds = hotelsResponse.data.slice(0, 10).map(hotel => hotel.hotelId).join(',');
      
      // Step 2: Get hotel offers with pricing
      const offersResponse = await this.client.shopping.hotelOffersSearch.get({
        hotelIds: hotelIds,
        checkInDate: checkin,
        checkOutDate: checkout,
        adults: adults,
        roomQuantity: rooms,
        currency: 'USD',
        bestRateOnly: true
      });
      
      return this.formatHotelSearchResults(offersResponse.data);
    } catch (error) {
      logger.error('Amadeus hotel search failed', { error: error.message });
      throw this.handleError(error);
    }
  }

  /**
   * Get hotel details by hotel ID
   * @param {string} hotelId - Amadeus hotel ID
   * @param {object} params - Additional parameters
   * @returns {Promise<object>} Hotel details
   */
  async getHotelDetails(hotelId, { checkin, checkout, adults = 2, rooms = 1 }) {
    try {
      if (!this.client) {
        throw new Error('Amadeus client not initialized. Check API credentials.');
      }

      logger.info('Amadeus hotel details', { hotelId });
      
      const response = await this.client.shopping.hotelOffersSearch.get({
        hotelIds: hotelId,
        checkInDate: checkin,
        checkOutDate: checkout,
        adults: adults,
        roomQuantity: rooms,
        currency: 'USD'
      });
      
      if (!response.data || response.data.length === 0) {
        throw new Error('Hotel not found');
      }
      
      return this.formatHotelDetails(response.data[0]);
    } catch (error) {
      logger.error('Amadeus hotel details failed', { hotelId, error: error.message });
      throw this.handleError(error);
    }
  }

  /**
   * Search for flights
   * @param {object} params - Search parameters
   * @param {string} params.origin - Origin airport code (e.g., JFK)
   * @param {string} params.destination - Destination airport code (e.g., CAI)
   * @param {string} params.departureDate - Departure date (YYYY-MM-DD)
   * @param {string} params.returnDate - Return date (YYYY-MM-DD) - optional
   * @param {number} params.adults - Number of adults
   * @param {string} params.travelClass - Travel class (ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST)
   * @returns {Promise<Array>} Array of flight results
   */
  async searchFlights({ origin, destination, departureDate, returnDate, adults = 1, travelClass = 'ECONOMY' }) {
    try {
      if (!this.client) {
        throw new Error('Amadeus client not initialized. Check API credentials.');
      }

      logger.info('Amadeus flight search', { origin, destination, departureDate, returnDate });
      
      const searchParams = {
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate: departureDate,
        adults: adults,
        travelClass: travelClass,
        currencyCode: 'USD',
        max: 50
      };
      
      // Add return date if provided (round trip)
      if (returnDate) {
        searchParams.returnDate = returnDate;
      }
      
      const response = await this.client.shopping.flightOffersSearch.get(searchParams);
      
      return this.formatFlightSearchResults(response.data);
    } catch (error) {
      logger.error('Amadeus flight search failed', { error: error.message });
      throw this.handleError(error);
    }
  }

  /**
   * Get flight price details
   * @param {object} flightOffer - Flight offer object from search
   * @returns {Promise<object>} Detailed flight pricing
   */
  async getFlightPrice(flightOffer) {
    try {
      if (!this.client) {
        throw new Error('Amadeus client not initialized. Check API credentials.');
      }

      const response = await this.client.shopping.flightOffers.pricing.post(
        JSON.stringify({
          data: {
            type: 'flight-offers-pricing',
            flightOffers: [flightOffer]
          }
        })
      );
      
      return response.data;
    } catch (error) {
      logger.error('Amadeus flight pricing failed', { error: error.message });
      throw this.handleError(error);
    }
  }

  /**
   * Format hotel search results
   * @param {Array} data - Raw Amadeus response
   * @returns {Array} Formatted hotel results
   */
  formatHotelSearchResults(data) {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    return data.map(hotelOffer => {
      const hotel = hotelOffer.hotel || {};
      const offer = hotelOffer.offers?.[0] || {};
      
      return {
        hotelId: hotel.hotelId || '',
        name: hotel.name || 'Unknown Hotel',
        location: `${hotel.cityCode || ''}, ${hotel.address?.countryCode || ''}`,
        address: hotel.address?.lines?.join(', ') || '',
        rating: hotel.rating || 0,
        price: {
          amount: parseFloat(offer.price?.total || 0),
          currency: offer.price?.currency || 'USD',
          perNight: true
        },
        amenities: hotel.amenities || [],
        available: hotelOffer.available !== false,
        offerId: offer.id || '',
        chainCode: hotel.chainCode || '',
        latitude: hotel.latitude || hotel.geoCode?.latitude || 0,
        longitude: hotel.longitude || hotel.geoCode?.longitude || 0
      };
    });
  }

  /**
   * Format hotel details
   * @param {object} data - Raw Amadeus response
   * @returns {object} Formatted hotel details
   */
  formatHotelDetails(data) {
    if (!data || !data.hotel) {
      throw new Error('Hotel not found');
    }
    
    const hotel = data.hotel;
    const offers = data.offers || [];
    const firstOffer = offers[0] || {};
    
    return {
      hotelId: hotel.hotelId,
      name: hotel.name,
      location: `${hotel.cityCode}, ${hotel.address?.countryCode}`,
      address: hotel.address?.lines?.join(', ') || '',
      fullAddress: `${hotel.address?.lines?.join(', ')}, ${hotel.cityCode}, ${hotel.address?.countryCode}`,
      description: hotel.description?.text || '',
      rating: hotel.rating || 0,
      amenities: hotel.amenities || [],
      price: {
        amount: parseFloat(firstOffer.price?.total || 0),
        currency: firstOffer.price?.currency || 'USD',
        perNight: true
      },
      rooms: offers.map(offer => ({
        offerId: offer.id,
        description: offer.room?.description?.text || offer.room?.type || '',
        bedType: offer.room?.typeEstimated?.bedType || '',
        beds: offer.room?.typeEstimated?.beds || 1,
        price: {
          amount: parseFloat(offer.price?.total || 0),
          currency: offer.price?.currency || 'USD'
        },
        policies: offer.policies || {}
      })),
      contact: hotel.contact || {},
      checkInTime: firstOffer.policies?.checkInOut?.checkIn || '14:00',
      checkOutTime: firstOffer.policies?.checkInOut?.checkOut || '12:00',
      latitude: hotel.latitude || hotel.geoCode?.latitude || 0,
      longitude: hotel.longitude || hotel.geoCode?.longitude || 0
    };
  }

  /**
   * Format flight search results
   * @param {Array} data - Raw Amadeus response
   * @returns {Array} Formatted flight results
   */
  formatFlightSearchResults(data) {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    return data.map(offer => {
      const itinerary = offer.itineraries?.[0] || {};
      const segment = itinerary.segments?.[0] || {};
      const price = offer.price || {};
      
      return {
        flightId: offer.id,
        airline: segment.carrierCode || '',
        flightNumber: `${segment.carrierCode}${segment.number}`,
        departure: {
          airport: segment.departure?.iataCode || '',
          terminal: segment.departure?.terminal || '',
          time: segment.departure?.at || '',
          city: segment.departure?.iataCode || ''
        },
        arrival: {
          airport: segment.arrival?.iataCode || '',
          terminal: segment.arrival?.terminal || '',
          time: segment.arrival?.at || '',
          city: segment.arrival?.iataCode || ''
        },
        duration: itinerary.duration || '',
        stops: itinerary.segments?.length - 1 || 0,
        cabinClass: segment.cabin || 'ECONOMY',
        price: {
          amount: parseFloat(price.total || 0),
          currency: price.currency || 'USD'
        },
        seats: offer.numberOfBookableSeats || 0,
        offerId: offer.id
      };
    });
  }

  /**
   * Handle and format API errors
   * @param {Error} error - Error object
   * @returns {Error} Formatted error
   */
  handleError(error) {
    if (error.response) {
      const apiError = new Error(
        error.response.result?.errors?.[0]?.detail || 'Amadeus API error'
      );
      apiError.code = 'API_ERROR';
      apiError.statusCode = error.response.statusCode || 500;
      apiError.details = error.response.result;
      return apiError;
    }
    
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      const timeoutError = new Error('Amadeus API request timeout');
      timeoutError.code = 'API_TIMEOUT';
      timeoutError.statusCode = 504;
      return timeoutError;
    }
    
    const networkError = new Error('Amadeus API is unavailable');
    networkError.code = 'API_UNAVAILABLE';
    networkError.statusCode = 503;
    return networkError;
  }
}

// Export singleton instance
module.exports = new AmadeusService();
