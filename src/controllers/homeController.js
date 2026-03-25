const { destinations, cities } = require('../data/destinations');
const logger = require('../utils/logger');
const { enrichWithWikipedia } = require('../services/wikipediaService');

/**
 * GET /api/home
 * Returns all data needed for the homescreen in a single request
 */
exports.getHomeData = async (req, res) => {
  try {
    const featured = destinations.filter(d => d.featured);
    const popular = destinations.filter(d => d.popular);

    res.json({
      success: true,
      data: {
        featured,        // Hero slider cards
        popular,         // Popular Places section
        destinations: cities  // Destination city cards
      }
    });
  } catch (error) {
    logger.error('Home data error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to load home data' }
    });
  }
};

/**
 * GET /api/home/destinations
 * Returns all destinations (for "See All" / "Explore" screens)
 */
exports.getAllDestinations = async (req, res) => {
  try {
    const { category, city, featured, popular } = req.query;

    let results = [...destinations];

    if (category) results = results.filter(d => d.category === category);
    if (city) results = results.filter(d => d.city.toLowerCase() === city.toLowerCase());
    if (featured === 'true') results = results.filter(d => d.featured);
    if (popular === 'true') results = results.filter(d => d.popular);

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    logger.error('Get destinations error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to load destinations' }
    });
  }
};

/**
 * GET /api/home/destinations/:id
 * Returns full detail for a single destination (detail screen)
 */
exports.getDestinationById = async (req, res) => {
  try {
    const { id } = req.params;
    const destination = destinations.find(d => d.id === id);

    if (!destination) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Destination not found' }
      });
    }

    // Enrich with Wikipedia for richer descriptions and images
    const enriched = await enrichWithWikipedia(destination);

    res.json({
      success: true,
      data: enriched
    });
  } catch (error) {
    logger.error('Get destination detail error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to load destination details' }
    });
  }
};

/**
 * GET /api/home/cities
 * Returns all city cards
 */
exports.getCities = async (req, res) => {
  try {
    res.json({
      success: true,
      count: cities.length,
      data: cities
    });
  } catch (error) {
    logger.error('Get cities error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to load cities' }
    });
  }
};

/**
 * GET /api/home/search
 * Search destinations by keyword
 */
exports.searchDestinations = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Search query must be at least 2 characters' }
      });
    }

    const keyword = q.toLowerCase().trim();

    const results = destinations.filter(d =>
      d.name.toLowerCase().includes(keyword) ||
      d.city.toLowerCase().includes(keyword) ||
      d.location.toLowerCase().includes(keyword) ||
      d.tags.some(tag => tag.toLowerCase().includes(keyword)) ||
      d.category.toLowerCase().includes(keyword)
    );

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    logger.error('Search destinations error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Search failed' }
    });
  }
};

/**
 * GET /api/home/map/markers
 * Returns all destinations as map markers (lightweight — only id, name, lat, lng, category, coverImage, rating, pricePerPerson)
 * Used to populate the map with pins on initial load
 */
exports.getMapMarkers = async (req, res) => {
  try {
    const { category, city } = req.query;

    let results = [...destinations];
    if (category) results = results.filter(d => d.category === category);
    if (city) results = results.filter(d => d.city.toLowerCase() === city.toLowerCase());

    const markers = results.map(d => ({
      id: d.id,
      name: d.name,
      location: d.location,
      city: d.city,
      lat: d.lat,
      lng: d.lng,
      category: d.category,
      coverImage: d.coverImage,
      rating: d.rating,
      pricePerPerson: d.pricePerPerson,
      currency: d.currency
    }));

    res.json({
      success: true,
      count: markers.length,
      data: markers
    });
  } catch (error) {
    logger.error('Get map markers error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to load map markers' }
    });
  }
};

/**
 * GET /api/home/map/search
 * Search destinations and return results with coordinates for map display
 * Used when user types in the search bar — results show as pins on map
 */
exports.mapSearch = async (req, res) => {
  try {
    const { q, category, city } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Search query must be at least 2 characters' }
      });
    }

    const keyword = q.toLowerCase().trim();

    let results = destinations.filter(d =>
      d.name.toLowerCase().includes(keyword) ||
      d.city.toLowerCase().includes(keyword) ||
      d.location.toLowerCase().includes(keyword) ||
      d.tags.some(tag => tag.toLowerCase().includes(keyword)) ||
      d.category.toLowerCase().includes(keyword)
    );

    if (category) results = results.filter(d => d.category === category);
    if (city) results = results.filter(d => d.city.toLowerCase() === city.toLowerCase());

    // Return full destination data including coordinates
    const mapResults = results.map(d => ({
      id: d.id,
      name: d.name,
      location: d.location,
      city: d.city,
      country: d.country,
      lat: d.lat,
      lng: d.lng,
      category: d.category,
      coverImage: d.coverImage,
      rating: d.rating,
      reviewCount: d.reviewCount,
      pricePerPerson: d.pricePerPerson,
      currency: d.currency,
      shortDescription: d.shortDescription,
      facilities: d.facilities,
      weather: d.weather
    }));

    // Compute a suggested map center/zoom based on results
    let mapView = null;
    if (mapResults.length === 1) {
      mapView = { lat: mapResults[0].lat, lng: mapResults[0].lng, zoom: 13 };
    } else if (mapResults.length > 1) {
      const avgLat = mapResults.reduce((sum, d) => sum + d.lat, 0) / mapResults.length;
      const avgLng = mapResults.reduce((sum, d) => sum + d.lng, 0) / mapResults.length;
      mapView = { lat: avgLat, lng: avgLng, zoom: 6 };
    }

    res.json({
      success: true,
      count: mapResults.length,
      mapView,   // Flutter uses this to animate the camera to the right position
      data: mapResults
    });
  } catch (error) {
    logger.error('Map search error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Map search failed' }
    });
  }
};

// ─── OpenTripMap (real data) endpoints ───────────────────────────────────────

const openTripMapService = require('../services/openTripMapService');
const { enrichWithWikipedia: enrichPlace } = require('../services/wikipediaService');

// City centers for Egypt's main cities
const CITY_CENTERS = {
  cairo:         { lat: 30.0444, lng: 31.2357 },
  luxor:         { lat: 25.6872, lng: 32.6396 },
  aswan:         { lat: 24.0889, lng: 32.8998 },
  'sharm-el-sheikh': { lat: 27.9158, lng: 34.3300 },
  hurghada:      { lat: 27.2579, lng: 33.8116 },
  alexandria:    { lat: 31.2001, lng: 29.9187 },
  dahab:         { lat: 28.4912, lng: 34.5131 },
  siwa:          { lat: 29.2031, lng: 25.5195 }
};

/**
 * GET /api/home/places/search?q=sphinx
 * Real-time place search via OpenTripMap (within Egypt)
 */
exports.searchRealPlaces = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Search query must be at least 2 characters' }
      });
    }

    if (!process.env.OPENTRIPMAP_API_KEY) {
      return res.status(503).json({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Places search service not configured' }
      });
    }

    const results = await openTripMapService.searchByKeyword(q.trim(), 20);

    // Compute map view
    let mapView = null;
    if (results.length === 1) {
      mapView = { lat: results[0].lat, lng: results[0].lng, zoom: 14 };
    } else if (results.length > 1) {
      const avgLat = results.reduce((s, d) => s + d.lat, 0) / results.length;
      const avgLng = results.reduce((s, d) => s + d.lng, 0) / results.length;
      mapView = { lat: avgLat, lng: avgLng, zoom: 7 };
    }

    res.json({ success: true, count: results.length, mapView, data: results });
  } catch (error) {
    logger.error('Real place search error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Place search failed' }
    });
  }
};

/**
 * GET /api/home/places/city/:cityId
 * Get real attractions for a specific city
 * cityId: cairo | luxor | aswan | sharm-el-sheikh | hurghada | alexandria | dahab | siwa
 */
exports.getCityPlaces = async (req, res) => {
  try {
    const { cityId } = req.params;
    const center = CITY_CENTERS[cityId.toLowerCase()];

    if (!center) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `City '${cityId}' not found. Available: ${Object.keys(CITY_CENTERS).join(', ')}` }
      });
    }

    if (!process.env.OPENTRIPMAP_API_KEY) {
      return res.status(503).json({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Places service not configured' }
      });
    }

    const limit = parseInt(req.query.limit) || 15;
    const results = await openTripMapService.getCityAttractions(center.lat, center.lng, limit);

    res.json({
      success: true,
      city: cityId,
      center,
      count: results.length,
      data: results
    });
  } catch (error) {
    logger.error('Get city places error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to load city places' }
    });
  }
};

/**
 * GET /api/home/places/:xid
 * Get full details for a real place by OpenTripMap xid
 */
exports.getRealPlaceDetails = async (req, res) => {
  try {
    const { xid } = req.params;

    if (!process.env.OPENTRIPMAP_API_KEY) {
      return res.status(503).json({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Places service not configured' }
      });
    }

    const place = await openTripMapService.getPlaceDetails(xid);

    // Enrich with Wikipedia if the place has a name
    const enriched = place.name ? await enrichPlace(place) : place;

    res.json({ success: true, data: enriched });
  } catch (error) {
    logger.error('Get real place details error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to load place details' }
    });
  }
};
