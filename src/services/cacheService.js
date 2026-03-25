const NodeCache = require('node-cache');
const logger = require('../utils/logger');

const CACHE_TTL = {
  search: parseInt(process.env.CACHE_TTL_SEARCH) || 3600,
  hotel: parseInt(process.env.CACHE_TTL_HOTEL) || 7200,
  location: parseInt(process.env.CACHE_TTL_LOCATION) || 86400,
  general: 3600
};

class CacheService {
  constructor() {
    this.searchCache = new NodeCache({ stdTTL: CACHE_TTL.search, checkperiod: 600, useClones: false });
    this.hotelCache = new NodeCache({ stdTTL: CACHE_TTL.hotel, checkperiod: 600 });
    this.locationCache = new NodeCache({ stdTTL: CACHE_TTL.location, checkperiod: 600 });
    this.generalCache = new NodeCache({ stdTTL: CACHE_TTL.general, checkperiod: 600 });

    this.stats = { hits: 0, misses: 0, sets: 0 };
    logger.info('Cache service initialized', CACHE_TTL);
  }

  // ─── Generic get/set (used by OpenTripMap and other services) ───────────────

  get(key) {
    const cached = this.generalCache.get(key);
    if (cached !== undefined) { this.stats.hits++; return cached; }
    this.stats.misses++;
    return null;
  }

  set(key, value, ttl = CACHE_TTL.general) {
    const success = this.generalCache.set(key, value, ttl);
    if (success) this.stats.sets++;
    return success;
  }

  // ─── Hotel search ────────────────────────────────────────────────────────────

  generateSearchKey({ location, checkin, checkout, guests, rooms }) {
    return `search:${location}:${checkin}:${checkout}:${guests}:${rooms}`;
  }

  getSearchResults(params) {
    const key = this.generateSearchKey(params);
    const cached = this.searchCache.get(key);
    if (cached) { this.stats.hits++; return cached; }
    this.stats.misses++;
    return null;
  }

  setSearchResults(params, results) {
    const key = this.generateSearchKey(params);
    const success = this.searchCache.set(key, results);
    if (success) this.stats.sets++;
    return success;
  }

  // ─── Hotel details ───────────────────────────────────────────────────────────

  generateHotelKey(hotelId, { checkin, checkout } = {}) {
    return checkin && checkout
      ? `hotel:${hotelId}:${checkin}:${checkout}`
      : `hotel:${hotelId}`;
  }

  getHotelDetails(hotelId, params = {}) {
    const key = this.generateHotelKey(hotelId, params);
    const cached = this.hotelCache.get(key);
    if (cached) { this.stats.hits++; return cached; }
    this.stats.misses++;
    return null;
  }

  setHotelDetails(hotelId, details, params = {}) {
    const key = this.generateHotelKey(hotelId, params);
    const success = this.hotelCache.set(key, details);
    if (success) this.stats.sets++;
    return success;
  }

  // ─── Location data ───────────────────────────────────────────────────────────

  getLocationData(location) {
    const key = `location:${location}`;
    const cached = this.locationCache.get(key);
    if (cached) { this.stats.hits++; return cached; }
    this.stats.misses++;
    return null;
  }

  setLocationData(location, data) {
    const key = `location:${location}`;
    const success = this.locationCache.set(key, data);
    if (success) this.stats.sets++;
    return success;
  }

  // ─── Utilities ───────────────────────────────────────────────────────────────

  clearAll() {
    this.searchCache.flushAll();
    this.hotelCache.flushAll();
    this.locationCache.flushAll();
    this.generalCache.flushAll();
    logger.info('All caches cleared');
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? `${(this.stats.hits / total * 100).toFixed(2)}%` : '0%',
      searchKeys: this.searchCache.keys().length,
      hotelKeys: this.hotelCache.keys().length,
      locationKeys: this.locationCache.keys().length,
      generalKeys: this.generalCache.keys().length
    };
  }
}

module.exports = new CacheService();
