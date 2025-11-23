const NodeCache = require('node-cache');
const bookingConfig = require('../config/bookingcom');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    // Initialize cache instances with different TTLs
    this.searchCache = new NodeCache({
      stdTTL: bookingConfig.cache.searchTTL,
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false // Better performance, but be careful with object mutations
    });
    
    this.hotelCache = new NodeCache({
      stdTTL: bookingConfig.cache.hotelTTL,
      checkperiod: 600
    });
    
    this.locationCache = new NodeCache({
      stdTTL: bookingConfig.cache.locationTTL,
      checkperiod: 600
    });
    
    // Track cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0
    };
    
    logger.info('Cache service initialized', {
      searchTTL: bookingConfig.cache.searchTTL,
      hotelTTL: bookingConfig.cache.hotelTTL,
      locationTTL: bookingConfig.cache.locationTTL
    });
  }

  /**
   * Generate cache key for hotel search
   * @param {object} params - Search parameters
   * @returns {string} Cache key
   */
  generateSearchKey({ location, checkin, checkout, guests, rooms }) {
    return `search:${location}:${checkin}:${checkout}:${guests}:${rooms}`;
  }

  /**
   * Generate cache key for hotel details
   * @param {string} hotelId - Hotel ID
   * @param {object} params - Additional parameters
   * @returns {string} Cache key
   */
  generateHotelKey(hotelId, { checkin, checkout } = {}) {
    if (checkin && checkout) {
      return `hotel:${hotelId}:${checkin}:${checkout}`;
    }
    return `hotel:${hotelId}`;
  }

  /**
   * Generate cache key for location data
   * @param {string} location - Location name
   * @returns {string} Cache key
   */
  generateLocationKey(location) {
    return `location:${location}`;
  }

  /**
   * Get cached hotel search results
   * @param {object} params - Search parameters
   * @returns {Array|null} Cached results or null
   */
  getSearchResults(params) {
    const key = this.generateSearchKey(params);
    const cached = this.searchCache.get(key);
    
    if (cached) {
      this.stats.hits++;
      logger.debug('Cache hit: search', { key });
      return cached;
    }
    
    this.stats.misses++;
    logger.debug('Cache miss: search', { key });
    return null;
  }

  /**
   * Cache hotel search results
   * @param {object} params - Search parameters
   * @param {Array} results - Search results to cache
   * @returns {boolean} Success
   */
  setSearchResults(params, results) {
    const key = this.generateSearchKey(params);
    const success = this.searchCache.set(key, results);
    
    if (success) {
      this.stats.sets++;
      logger.debug('Cache set: search', { key, resultCount: results.length });
    }
    
    return success;
  }

  /**
   * Get cached hotel details
   * @param {string} hotelId - Hotel ID
   * @param {object} params - Additional parameters
   * @returns {object|null} Cached hotel details or null
   */
  getHotelDetails(hotelId, params = {}) {
    const key = this.generateHotelKey(hotelId, params);
    const cached = this.hotelCache.get(key);
    
    if (cached) {
      this.stats.hits++;
      logger.debug('Cache hit: hotel', { key });
      return cached;
    }
    
    this.stats.misses++;
    logger.debug('Cache miss: hotel', { key });
    return null;
  }

  /**
   * Cache hotel details
   * @param {string} hotelId - Hotel ID
   * @param {object} details - Hotel details to cache
   * @param {object} params - Additional parameters
   * @returns {boolean} Success
   */
  setHotelDetails(hotelId, details, params = {}) {
    const key = this.generateHotelKey(hotelId, params);
    const success = this.hotelCache.set(key, details);
    
    if (success) {
      this.stats.sets++;
      logger.debug('Cache set: hotel', { key });
    }
    
    return success;
  }

  /**
   * Get cached location data
   * @param {string} location - Location name
   * @returns {object|null} Cached location data or null
   */
  getLocationData(location) {
    const key = this.generateLocationKey(location);
    const cached = this.locationCache.get(key);
    
    if (cached) {
      this.stats.hits++;
      logger.debug('Cache hit: location', { key });
      return cached;
    }
    
    this.stats.misses++;
    logger.debug('Cache miss: location', { key });
    return null;
  }

  /**
   * Cache location data
   * @param {string} location - Location name
   * @param {object} data - Location data to cache
   * @returns {boolean} Success
   */
  setLocationData(location, data) {
    const key = this.generateLocationKey(location);
    const success = this.locationCache.set(key, data);
    
    if (success) {
      this.stats.sets++;
      logger.debug('Cache set: location', { key });
    }
    
    return success;
  }

  /**
   * Clear all caches
   */
  clearAll() {
    this.searchCache.flushAll();
    this.hotelCache.flushAll();
    this.locationCache.flushAll();
    logger.info('All caches cleared');
  }

  /**
   * Clear specific cache type
   * @param {string} type - Cache type ('search', 'hotel', 'location')
   */
  clear(type) {
    switch (type) {
      case 'search':
        this.searchCache.flushAll();
        break;
      case 'hotel':
        this.hotelCache.flushAll();
        break;
      case 'location':
        this.locationCache.flushAll();
        break;
      default:
        logger.warn('Unknown cache type', { type });
    }
    logger.info('Cache cleared', { type });
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      searchKeys: this.searchCache.keys().length,
      hotelKeys: this.hotelCache.keys().length,
      locationKeys: this.locationCache.keys().length
    };
  }
}

// Export singleton instance
module.exports = new CacheService();
