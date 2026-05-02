const axios = require('axios');
const cacheService = require('./cacheService');
const logger = require('../utils/logger');

const BASE_URL = 'https://maps.googleapis.com/maps/api/place';
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

/**
 * Search for a place by name and location to get its Google Place ID
 * @param {string} name - Place name
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
async function findPlaceId(name, lat, lng) {
  if (!API_KEY) return null;

  try {
    const response = await axios.get(`${BASE_URL}/findplacefromtext/json`, {
      params: {
        input: name,
        inputtype: 'textquery',
        locationbias: `point:${lat},${lng}`,
        fields: 'place_id,name,rating',
        key: API_KEY
      },
      timeout: 8000
    });

    const candidates = response.data.candidates;
    if (candidates && candidates.length > 0) {
      return candidates[0].place_id;
    }
    return null;
  } catch (error) {
    logger.warn('Google Places findPlaceId failed', { name, error: error.message });
    return null;
  }
}

/**
 * Get place details including reviews from Google Places API
 * @param {string} placeId - Google Place ID
 */
async function getPlaceDetails(placeId) {
  if (!API_KEY) return null;

  const cacheKey = `google_place_${placeId}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${BASE_URL}/details/json`, {
      params: {
        place_id: placeId,
        fields: 'name,rating,reviews,photos,formatted_address,opening_hours,geometry',
        key: API_KEY,
        language: 'en'
      },
      timeout: 10000
    });

    if (response.data.status !== 'OK') {
      logger.warn('Google Places API returned non-OK status', { status: response.data.status, placeId });
      return null;
    }

    const result = response.data.result;
    const formatted = {
      googlePlaceId: placeId,
      name: result.name,
      rating: result.rating || 0,
      address: result.formatted_address || '',
      // Precise coordinates from Google — use these for map pin
      location: result.geometry?.location
        ? { lat: result.geometry.location.lat, lng: result.geometry.location.lng }
        : null,
      openingHours: result.opening_hours?.weekday_text || [],
      reviews: (result.reviews || []).map(r => ({
        id: `google_${r.time}`,
        source: 'google',
        authorName: r.author_name,
        authorAvatar: r.profile_photo_url || null,
        rating: r.rating,
        text: r.text,
        time: r.relative_time_description,
        timestamp: new Date(r.time * 1000).toISOString()
      })),
      photos: (result.photos || []).slice(0, 5).map(p => ({
        reference: p.photo_reference,
        // Full proxy URL — client calls our server which fetches from Google server-side
        url: `${process.env.APP_URL || 'https://egy-travel-89eca3b6683d.herokuapp.com'}/api/places/photo?ref=${p.photo_reference}`
      }))
    };

    // Cache for 6 hours — photo_reference tokens expire, don't cache too long
    cacheService.set(cacheKey, formatted, 21600);
    return formatted;
  } catch (error) {
    logger.error('Google Places getPlaceDetails failed', { placeId, error: error.message });
    return null;
  }
}

/**
 * Get Google reviews for a destination by our internal ID
 * Always uses text search to find the correct Place ID dynamically
 */
async function getReviewsForDestination(destinationId, destinationName, lat, lng) {
  if (!API_KEY) return null;

  // Always search dynamically — more reliable than hardcoded IDs
  const placeId = await findPlaceId(destinationName + ' Egypt', lat, lng);
  if (!placeId) return null;

  // Cache the place ID mapping for future calls (1 day)
  cacheService.set(`google_placeid_${destinationId}`, placeId, 86400);

  return await getPlaceDetails(placeId);
}

/**
 * Search for restaurants near a city using Google Places Text Search
 * @param {string} city - City name
 * @param {string} cuisine - Optional cuisine type filter
 * @param {number} lat - City center latitude
 * @param {number} lng - City center longitude
 * @param {number} limit - Max results (default 10)
 */
async function searchRestaurants(city, cuisine = null, lat, lng, limit = 10) {
  if (!API_KEY) return null;

  const query = cuisine
    ? `${cuisine} restaurant in ${city} Egypt`
    : `best restaurant in ${city} Egypt`;

  const cacheKey = `restaurants_${city}_${cuisine || 'all'}_${limit}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${BASE_URL}/textsearch/json`, {
      params: {
        query,
        type: 'restaurant',
        key: API_KEY,
        language: 'en'
      },
      timeout: 10000
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      logger.warn('Google Places restaurant search failed', { status: response.data.status, query });
      return null;
    }

    const results = (response.data.results || []).slice(0, limit).map(r => ({
      id: r.place_id,
      googlePlaceId: r.place_id,
      title: r.name,
      name: r.name,
      location: r.formatted_address || city,
      city,
      rating: r.rating || 0,
      priceLevel: r.price_level || null,
      priceDisplay: r.price_level ? '$'.repeat(r.price_level) : '$',
      coverImage: r.photos?.[0]
        ? `${process.env.APP_URL || 'https://egy-travel-89eca3b6683d.herokuapp.com'}/api/places/photo?ref=${r.photos[0].photo_reference}`
        : null,
      lat: r.geometry?.location?.lat || lat,
      lng: r.geometry?.location?.lng || lng,
      isOpen: r.opening_hours?.open_now ?? null,
      types: r.types || []
    }));

    cacheService.set(cacheKey, results, 3600); // cache 1 hour
    return results;
  } catch (error) {
    logger.error('Google Places restaurant search failed', { query, error: error.message });
    return null;
  }
}

/**
 * Get restaurant details including photos and reviews
 * @param {string} placeId - Google Place ID
 */
async function getRestaurantDetails(placeId) {
  if (!API_KEY) return null;

  const cacheKey = `restaurant_detail_${placeId}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${BASE_URL}/details/json`, {
      params: {
        place_id: placeId,
        fields: 'name,rating,reviews,photos,formatted_address,opening_hours,geometry,formatted_phone_number,website,price_level',
        key: API_KEY,
        language: 'en'
      },
      timeout: 10000
    });

    if (response.data.status !== 'OK') return null;

    const r = response.data.result;
    const BASE = process.env.APP_URL || 'https://egy-travel-89eca3b6683d.herokuapp.com';

    const result = {
      googlePlaceId: placeId,
      title: r.name,
      name: r.name,
      address: r.formatted_address || '',
      location: r.formatted_address || '',
      rating: r.rating || 0,
      priceLevel: r.price_level || null,
      priceDisplay: r.price_level ? '$'.repeat(r.price_level) : '$',
      phone: r.formatted_phone_number || null,
      website: r.website || null,
      openingHours: r.opening_hours?.weekday_text || [],
      isOpen: r.opening_hours?.open_now ?? null,
      lat: r.geometry?.location?.lat || null,
      lng: r.geometry?.location?.lng || null,
      mapLocation: r.geometry?.location || null,
      images: (r.photos || []).slice(0, 5).map(p => `${BASE}/api/places/photo?ref=${p.photo_reference}`),
      coverImage: r.photos?.[0] ? `${BASE}/api/places/photo?ref=${r.photos[0].photo_reference}` : null,
      reviews: (r.reviews || []).map(rev => ({
        id: `google_${rev.time}`,
        source: 'google',
        authorName: rev.author_name,
        authorAvatar: rev.profile_photo_url || null,
        rating: rev.rating,
        text: rev.text,
        time: rev.relative_time_description,
        timestamp: new Date(rev.time * 1000).toISOString()
      }))
    };

    cacheService.set(cacheKey, result, 21600); // cache 6 hours
    return result;
  } catch (error) {
    logger.error('Google Places getRestaurantDetails failed', { placeId, error: error.message });
    return null;
  }
}

module.exports = { getReviewsForDestination, getPlaceDetails, findPlaceId, searchRestaurants, getRestaurantDetails };
