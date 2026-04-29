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
        fields: 'place_id,name,rating,user_ratings_total',
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
        fields: 'name,rating,user_ratings_total,reviews,photos,formatted_address,opening_hours',
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
      totalRatings: result.user_ratings_total || 0,
      address: result.formatted_address || '',
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
        url: `${BASE_URL}/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${API_KEY}`
      }))
    };

    // Cache for 24 hours — Google reviews don't change that often
    cacheService.set(cacheKey, formatted, 86400);
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

  // Cache the place ID mapping for future calls
  cacheService.set(`google_placeid_${destinationId}`, placeId, 86400 * 7); // cache 7 days

  return await getPlaceDetails(placeId);
}

module.exports = { getReviewsForDestination, getPlaceDetails, findPlaceId };
