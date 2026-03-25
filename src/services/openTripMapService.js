const axios = require('axios');
const cacheService = require('./cacheService');
const logger = require('../utils/logger');

const BASE_URL = 'https://api.opentripmap.com/0.1/en/places';
const API_KEY = process.env.OPENTRIPMAP_API_KEY;

// Egypt bounding box — restricts all searches to Egypt only
const EGYPT_BOUNDS = {
  lonMin: 24.7,
  latMin: 21.9,
  lonMax: 37.2,
  latMax: 31.7
};

// Map OpenTripMap kinds to our categories
const KIND_TO_CATEGORY = {
  historic: 'historical',
  cultural: 'historical',
  archaeology: 'historical',
  architecture: 'landmark',
  natural: 'nature',
  beaches: 'beach',
  water: 'beach',
  religion: 'landmark',
  museums: 'landmark',
  urban_environment: 'city',
  foods: 'restaurant'
};

/**
 * Search places near a city center by coordinates
 * @param {number} lat - Latitude of city center
 * @param {number} lng - Longitude of city center
 * @param {number} radiusMeters - Search radius in meters
 * @param {string} kinds - OpenTripMap category kinds
 * @param {number} limit - Max results
 */
async function searchPlacesNearby({ lat, lng, radiusMeters = 10000, kinds = 'interesting_places', limit = 20 }) {
  if (!API_KEY) throw new Error('OPENTRIPMAP_API_KEY not configured');

  const cacheKey = `otm_nearby_${lat}_${lng}_${radiusMeters}_${kinds}_${limit}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${BASE_URL}/radius`, {
      params: {
        radius: radiusMeters,
        lon: lng,
        lat: lat,
        kinds,
        limit,
        format: 'json',
        apikey: API_KEY
      },
      timeout: 10000
    });

    const places = response.data
      .filter(p => p.name && p.name.trim() !== '') // skip unnamed places
      .map(formatBasicPlace);

    cacheService.set(cacheKey, places, 3600); // cache 1 hour
    return places;
  } catch (error) {
    logger.error('OpenTripMap nearby search failed', { error: error.message });
    throw error;
  }
}

/**
 * Get full details for a single place by xid
 * @param {string} xid - OpenTripMap place ID
 */
async function getPlaceDetails(xid) {
  if (!API_KEY) throw new Error('OPENTRIPMAP_API_KEY not configured');

  const cacheKey = `otm_detail_${xid}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${BASE_URL}/xid/${xid}`, {
      params: { apikey: API_KEY },
      timeout: 10000
    });

    const detail = formatDetailedPlace(response.data);
    cacheService.set(cacheKey, detail, 7200); // cache 2 hours
    return detail;
  } catch (error) {
    logger.error('OpenTripMap place details failed', { xid, error: error.message });
    throw error;
  }
}

/**
 * Search places by name/keyword within Egypt
 * @param {string} keyword - Search term
 * @param {number} limit - Max results
 */
async function searchByKeyword(keyword, limit = 15) {
  if (!API_KEY) throw new Error('OPENTRIPMAP_API_KEY not configured');

  const cacheKey = `otm_search_${keyword}_${limit}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${BASE_URL}/bbox`, {
      params: {
        lon_min: EGYPT_BOUNDS.lonMin,
        lat_min: EGYPT_BOUNDS.latMin,
        lon_max: EGYPT_BOUNDS.lonMax,
        lat_max: EGYPT_BOUNDS.latMax,
        kinds: 'interesting_places,historic,cultural,natural,beaches',
        name: keyword,
        limit,
        format: 'json',
        apikey: API_KEY
      },
      timeout: 10000
    });

    const places = response.data
      .filter(p => p.name && p.name.trim() !== '')
      .map(formatBasicPlace);

    cacheService.set(cacheKey, places, 3600);
    return places;
  } catch (error) {
    logger.error('OpenTripMap keyword search failed', { keyword, error: error.message });
    throw error;
  }
}

/**
 * Get top attractions for a city (used for homescreen popular places)
 * @param {number} lat - City center latitude
 * @param {number} lng - City center longitude
 * @param {number} limit - Max results
 */
async function getCityAttractions(lat, lng, limit = 10) {
  return searchPlacesNearby({
    lat,
    lng,
    radiusMeters: 15000,
    kinds: 'historic,cultural,archaeology,architecture,natural,museums',
    limit
  });
}

// ─── Formatters ──────────────────────────────────────────────────────────────

function formatBasicPlace(place) {
  const kinds = place.kinds ? place.kinds.split(',') : [];
  const primaryKind = kinds[0] || 'interesting_places';
  const category = KIND_TO_CATEGORY[primaryKind] || 'landmark';

  return {
    id: place.xid,
    name: place.name,
    lat: place.point?.lat || place.lat || 0,
    lng: place.point?.lon || place.lon || 0,
    category,
    kinds: kinds.slice(0, 3),
    rating: place.rate ? parseFloat(place.rate) : null,
    coverImage: place.preview?.source || null,
    source: 'opentripmap'
  };
}

function formatDetailedPlace(place) {
  const kinds = place.kinds ? place.kinds.split(',') : [];
  const primaryKind = kinds[0] || 'interesting_places';
  const category = KIND_TO_CATEGORY[primaryKind] || 'landmark';

  return {
    id: place.xid,
    name: place.name,
    lat: place.point?.lat || 0,
    lng: place.point?.lon || 0,
    category,
    kinds,
    description: place.wikipedia_extracts?.text || place.info?.descr || '',
    shortDescription: place.wikipedia_extracts?.text
      ? place.wikipedia_extracts.text.substring(0, 200) + '...'
      : '',
    address: place.address
      ? [place.address.road, place.address.city, place.address.country]
          .filter(Boolean)
          .join(', ')
      : '',
    city: place.address?.city || place.address?.town || '',
    country: place.address?.country || 'Egypt',
    images: place.preview?.source ? [place.preview.source] : [],
    coverImage: place.preview?.source || null,
    rating: place.rate ? parseFloat(place.rate) : null,
    wikipediaUrl: place.wikipedia || null,
    osmUrl: place.otm || null,
    source: 'opentripmap'
  };
}

module.exports = {
  searchPlacesNearby,
  getPlaceDetails,
  searchByKeyword,
  getCityAttractions
};
