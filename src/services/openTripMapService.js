const axios = require('axios');
const cacheService = require('./cacheService');
const logger = require('../utils/logger');

const BASE_URL = 'https://api.opentripmap.com/0.1/en/places';
const API_KEY = process.env.OPENTRIPMAP_API_KEY;

// Egypt bounding box
const EGYPT_BOUNDS = { lonMin: 24.7, latMin: 21.9, lonMax: 37.2, latMax: 31.7 };

// Category → OpenTripMap kinds mapping
const CATEGORY_KINDS = {
  'Historical':        'historic,archaeology,cultural,architecture',
  'Religious':         'religion,churches,monasteries,mosques',
  'Nature':            'natural,national_parks,nature_reserves,geological_formations',
  'Sea & Water':       'beaches,water,diving,snorkeling',
  'Culture':           'museums,theatres_and_entertainments,art_galleries,cultural',
  'Entertainment':     'amusements,zoos,aquariums,theme_parks',
  'Landmarks':         'interesting_places,architecture,monuments',
  'All':               'interesting_places,historic,natural,beaches,religion,museums,cultural'
};
// Our category label from OTM kinds
const KIND_TO_CATEGORY = {
  historic: 'Historical', cultural: 'Culture', archaeology: 'Historical',
  architecture: 'Landmarks', natural: 'Nature', beaches: 'Sea & Water',
  water: 'Sea & Water', religion: 'Religious', museums: 'Culture',
  churches: 'Religious', monasteries: 'Religious', mosques: 'Religious',
  national_parks: 'Nature', nature_reserves: 'Nature', monuments: 'Landmarks',
  interesting_places: 'Landmarks', amusements: 'Entertainment',
  theatres_and_entertainments: 'Entertainment', art_galleries: 'Culture'
};

// Fallback images by kind — ensures every place has an image
const FALLBACK_IMAGES = {
  egyptian_temples:  'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=800',
  archaeology:       'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=800',
  historic:          'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800',
  burial_places:     'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800',
  cemeteries:        'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800',
  architecture:      'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=800',
  religion:          'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800',
  mosques:           'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800',
  churches:          'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800',
  monasteries:       'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800',
  natural:           'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800',
  national_parks:    'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800',
  beaches:           'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
  water:             'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
  museums:           'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800',
  art_galleries:     'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800',
  default:           'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=800'
};

function getFallbackImage(kinds) {
  for (const kind of kinds) {
    if (FALLBACK_IMAGES[kind]) return FALLBACK_IMAGES[kind];
  }
  return FALLBACK_IMAGES.default;
}

// Egypt city centers
const CITY_CENTERS = {
  cairo:             { lat: 30.0444, lng: 31.2357, radius: 20000 },
  luxor:             { lat: 25.6872, lng: 32.6396, radius: 15000 },
  aswan:             { lat: 24.0889, lng: 32.8998, radius: 15000 },
  'sharm-el-sheikh': { lat: 27.9158, lng: 34.3300, radius: 20000 },
  hurghada:          { lat: 27.2579, lng: 33.8116, radius: 20000 },
  alexandria:        { lat: 31.2001, lng: 29.9187, radius: 20000 },
  dahab:             { lat: 28.4912, lng: 34.5131, radius: 15000 },
  siwa:              { lat: 29.2031, lng: 25.5195, radius: 15000 },
  'marsa-alam':      { lat: 25.0657, lng: 34.8941, radius: 15000 },
  'el-gouna':        { lat: 27.3956, lng: 33.6756, radius: 10000 }
};

/**
 * Get places by category with real images via detail API
 * Fetches a page of 20 places and enriches each with a real photo
 * @param {string} category
 * @param {number} page - Page number (1-based)
 * @param {number} pageSize - Items per page (default 20)
 */
async function getPlacesWithImages(category = 'All', page = 1, pageSize = 20) {
  if (!API_KEY) throw new Error('OPENTRIPMAP_API_KEY not configured');

  // Normalize category
  const normalizedCategory = Object.keys(CATEGORY_KINDS).find(
    k => k.toLowerCase() === category.toLowerCase() ||
         k.toLowerCase().replace(/[^a-z]/g, '') === category.toLowerCase().replace(/[^a-z]/g, '')
  ) || 'All';

  // Fetch a larger pool to paginate from (cached)
  const allPlaces = await getPlacesByCategory(normalizedCategory, 200);

  // Paginate
  const offset = (page - 1) * pageSize;
  const pagePlaces = allPlaces.slice(offset, offset + pageSize);
  const hasMore = offset + pageSize < allPlaces.length;

  // Enrich each place with real image from detail API
  const enriched = await Promise.all(
    pagePlaces.map(async (place) => {
      // Already has a real image (not a fallback) — skip detail call
      if (place.coverImage && !place.coverImage.includes('unsplash.com')) {
        return place;
      }

      const cacheKey = `otm_img_${place.id}`;
      const cached = cacheService.get(cacheKey);
      if (cached) return { ...place, coverImage: cached };

      try {
        const detail = await getPlaceDetails(place.id);
        if (detail.coverImage && !detail.coverImage.includes('unsplash.com')) {
          cacheService.set(cacheKey, detail.coverImage, 86400); // cache 24h
          return { ...place, coverImage: detail.coverImage };
        }
      } catch {}

      return place; // keep fallback if detail fails
    })
  );

  return {
    data: enriched,
    page,
    pageSize,
    hasMore,
    total: allPlaces.length
  };
}

/**
 * Get places by category across all of Egypt (bbox search)
 * Returns up to `limit` places for a given category
 */
async function getPlacesByCategory(category = 'All', limit = 50) {
  if (!API_KEY) throw new Error('OPENTRIPMAP_API_KEY not configured');

  // Normalize category — handle URL encoding issues like "Sea " instead of "Sea & Water"
  const normalizedCategory = Object.keys(CATEGORY_KINDS).find(
    k => k.toLowerCase() === category.toLowerCase() ||
         k.toLowerCase().replace(/[^a-z]/g, '') === category.toLowerCase().replace(/[^a-z]/g, '')
  ) || 'All';

  const kinds = CATEGORY_KINDS[normalizedCategory];
  const cacheKey = `otm_cat_${normalizedCategory}_${limit}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${BASE_URL}/bbox`, {
      params: {
        lon_min: EGYPT_BOUNDS.lonMin,
        lat_min: EGYPT_BOUNDS.latMin,
        lon_max: EGYPT_BOUNDS.lonMax,
        lat_max: EGYPT_BOUNDS.latMax,
        kinds,
        limit,
        format: 'json',
        apikey: API_KEY
      },
      timeout: 15000
    });

    const places = (response.data || [])
      .filter(p => p.name && p.name.trim() !== '')
      .map(p => formatBasicPlace(p, normalizedCategory));

    cacheService.set(cacheKey, places, 3600);
    return places;
  } catch (error) {
    logger.error('OpenTripMap category search failed', { category, error: error.message });
    throw error;
  }
}

/**
 * Get places near a city center
 */
async function searchPlacesNearby({ lat, lng, radiusMeters = 15000, kinds = 'interesting_places', limit = 30 }) {
  if (!API_KEY) throw new Error('OPENTRIPMAP_API_KEY not configured');

  const cacheKey = `otm_nearby_${lat}_${lng}_${kinds}_${limit}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${BASE_URL}/radius`, {
      params: { radius: radiusMeters, lon: lng, lat, kinds, limit, format: 'json', apikey: API_KEY },
      timeout: 12000
    });

    const places = (response.data || [])
      .filter(p => p.name && p.name.trim() !== '')
      .map(p => formatBasicPlace(p));

    cacheService.set(cacheKey, places, 3600);
    return places;
  } catch (error) {
    logger.error('OpenTripMap nearby search failed', { error: error.message });
    throw error;
  }
}

/**
 * Get places for a city by cityId, optionally filtered by category
 */
async function getCityPlaces(cityId, category = 'All', limit = 40) {
  const city = CITY_CENTERS[cityId.toLowerCase()];
  if (!city) throw new Error(`Unknown city: ${cityId}`);

  const kinds = CATEGORY_KINDS[category] || CATEGORY_KINDS['All'];
  return searchPlacesNearby({ lat: city.lat, lng: city.lng, radiusMeters: city.radius, kinds, limit });
}

/**
 * Search by keyword within Egypt
 */
async function searchByKeyword(keyword, limit = 20) {
  if (!API_KEY) throw new Error('OPENTRIPMAP_API_KEY not configured');

  const cacheKey = `otm_search_${keyword}_${limit}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${BASE_URL}/bbox`, {
      params: {
        lon_min: EGYPT_BOUNDS.lonMin, lat_min: EGYPT_BOUNDS.latMin,
        lon_max: EGYPT_BOUNDS.lonMax, lat_max: EGYPT_BOUNDS.latMax,
        kinds: CATEGORY_KINDS['All'],
        name: keyword,
        limit,
        format: 'json',
        apikey: API_KEY
      },
      timeout: 12000
    });

    const places = (response.data || [])
      .filter(p => p.name && p.name.trim() !== '')
      .map(p => formatBasicPlace(p));

    cacheService.set(cacheKey, places, 3600);
    return places;
  } catch (error) {
    logger.error('OpenTripMap keyword search failed', { keyword, error: error.message });
    throw error;
  }
}

/**
 * Get full details for a single place
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
    cacheService.set(cacheKey, detail, 7200);
    return detail;
  } catch (error) {
    logger.error('OpenTripMap place details failed', { xid, error: error.message });
    throw error;
  }
}

// Legacy alias
async function getCityAttractions(lat, lng, limit = 20) {
  return searchPlacesNearby({ lat, lng, radiusMeters: 15000, kinds: CATEGORY_KINDS['Historical'], limit });
}

// ─── Formatters ──────────────────────────────────────────────────────────────

function formatBasicPlace(place, overrideCategory = null) {
  const kinds = place.kinds ? place.kinds.split(',') : [];
  const primaryKind = kinds[0] || 'interesting_places';
  const category = overrideCategory || KIND_TO_CATEGORY[primaryKind] || 'Landmarks';
  // Only use real OTM image — no fake fallbacks
  const coverImage = place.preview?.source || null;

  return {
    id: place.xid,
    name: place.name,
    lat: place.point?.lat || place.lat || 0,
    lng: place.point?.lon || place.lon || 0,
    category,
    kinds: kinds.slice(0, 3),
    rating: place.rate ? parseFloat(place.rate) : null,
    coverImage,
    source: 'opentripmap'
  };
}

function formatDetailedPlace(place) {
  const kinds = place.kinds ? place.kinds.split(',') : [];
  const primaryKind = kinds[0] || 'interesting_places';
  const category = KIND_TO_CATEGORY[primaryKind] || 'Landmarks';

  // Priority: OTM preview → Wikipedia thumbnail → fallback by kind
  const coverImage = place.preview?.source || getFallbackImage(kinds);

  return {
    id: place.xid,
    name: place.name,
    lat: place.point?.lat || 0,
    lng: place.point?.lon || 0,
    category,
    kinds,
    description: place.wikipedia_extracts?.text || place.info?.descr || '',
    shortDescription: place.wikipedia_extracts?.text
      ? place.wikipedia_extracts.text.substring(0, 200) + '...' : '',
    address: place.address
      ? [place.address.road, place.address.city, place.address.country].filter(Boolean).join(', ')
      : '',
    city: place.address?.city || place.address?.town || '',
    country: place.address?.country || 'Egypt',
    images: coverImage ? [coverImage] : [],
    coverImage,
    rating: place.rate ? parseFloat(place.rate) : null,
    wikipediaUrl: place.wikipedia || null,
    source: 'opentripmap'
  };
}

module.exports = {
  getPlacesWithImages,
  getPlacesByCategory,
  searchPlacesNearby,
  getCityPlaces,
  searchByKeyword,
  getPlaceDetails,
  getCityAttractions,
  CATEGORY_KINDS,
  CITY_CENTERS
};
