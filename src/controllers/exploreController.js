const { places: staticPlaces, restaurants, curatedHotels, popularFlightRoutes } = require('../data/exploreData');
const openTripMapService = require('../services/openTripMapService');
const logger = require('../utils/logger');

// Categories available for filtering
const CATEGORIES = ['All', 'Historical', 'Religious', 'Nature', 'Sea & Water', 'Culture', 'Entertainment', 'Landmarks'];

/**
 * GET /api/explore
 * Full explore screen — static popular places + live data sections
 */
exports.getExploreData = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        categories: CATEGORIES,
        popularPlaces: staticPlaces,           // Static curated top places
        restaurants: restaurants.slice(0, 4),
        hotels: curatedHotels.slice(0, 4),
        flights: popularFlightRoutes
      }
    });
  } catch (error) {
    logger.error('Get explore data error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load explore data' } });
  }
};

/**
 * GET /api/explore/places?category=Historical&city=cairo&limit=40
 * Live places from OpenTripMap, filtered by category
 * Falls back to static data if OpenTripMap is unavailable
 */
exports.getPlaces = async (req, res) => {
  try {
    const { category = 'All', city, limit = 40 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 40, 100);

    // If city specified, get places near that city
    if (city) {
      try {
        const places = await openTripMapService.getCityPlaces(city.toLowerCase(), category, limitNum);
        return res.json({
          success: true,
          source: 'opentripmap',
          category,
          city,
          count: places.length,
          categories: CATEGORIES,
          data: places
        });
      } catch (err) {
        logger.warn('OpenTripMap city places failed, falling back to static', { city, err: err.message });
      }
    }

    // No city — get places across all Egypt by category
    try {
      const places = await openTripMapService.getPlacesByCategory(category, limitNum);
      return res.json({
        success: true,
        source: 'opentripmap',
        category,
        count: places.length,
        categories: CATEGORIES,
        data: places
      });
    } catch (err) {
      logger.warn('OpenTripMap category search failed, falling back to static', { err: err.message });
    }

    // Fallback to static data
    let results = [...staticPlaces];
    if (category && category !== 'All') {
      results = results.filter(p => p.category === category);
    }
    res.json({
      success: true,
      source: 'static',
      category,
      count: results.length,
      categories: CATEGORIES,
      data: results.slice(0, limitNum)
    });
  } catch (error) {
    logger.error('Get places error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load places' } });
  }
};

/**
 * GET /api/explore/places/:id
 * Single place — checks static first, then OpenTripMap
 */
exports.getPlaceById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check static data first
    const staticPlace = staticPlaces.find(p => p.id === id);
    if (staticPlace) {
      return res.json({ success: true, source: 'static', data: staticPlace });
    }

    // Try OpenTripMap (xid)
    try {
      const place = await openTripMapService.getPlaceDetails(id);
      return res.json({ success: true, source: 'opentripmap', data: place });
    } catch (err) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Place not found' } });
    }
  } catch (error) {
    logger.error('Get place by id error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load place' } });
  }
};

/**
 * GET /api/explore/restaurants?city=Cairo&category=Egyptian
 */
exports.getRestaurants = async (req, res) => {
  try {
    const { city, category, limit } = req.query;
    const limitNum = parseInt(limit) || 20;

    let results = [...restaurants];
    if (city) results = results.filter(r => r.city.toLowerCase() === city.toLowerCase());
    if (category) results = results.filter(r => r.category === category);

    res.json({ success: true, count: results.slice(0, limitNum).length, data: results.slice(0, limitNum) });
  } catch (error) {
    logger.error('Get restaurants error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load restaurants' } });
  }
};

/**
 * GET /api/explore/restaurants/:id
 */
exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = restaurants.find(r => r.id === req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Restaurant not found' } });
    }
    res.json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load restaurant' } });
  }
};

/**
 * GET /api/explore/hotels?city=Aswan&category=Luxury
 */
exports.getCuratedHotels = async (req, res) => {
  try {
    const { city, category, limit } = req.query;
    const limitNum = parseInt(limit) || 20;

    let results = [...curatedHotels];
    if (city) results = results.filter(h => h.city.toLowerCase() === city.toLowerCase());
    if (category) results = results.filter(h => h.category === category);

    res.json({ success: true, count: results.slice(0, limitNum).length, data: results.slice(0, limitNum) });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load hotels' } });
  }
};

/**
 * GET /api/explore/flights
 */
exports.getPopularFlights = async (req, res) => {
  try {
    res.json({ success: true, count: popularFlightRoutes.length, data: popularFlightRoutes });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load flights' } });
  }
};

/**
 * GET /api/explore/map?type=places|restaurants|hotels|all&category=Historical
 */
exports.getExploreMapMarkers = async (req, res) => {
  try {
    const { type, category } = req.query;

    let placeMarkers = [];

    // Get live place markers from OpenTripMap
    try {
      const livePlaces = await openTripMapService.getPlacesByCategory(category || 'All', 80);
      placeMarkers = livePlaces.filter(p => p.lat && p.lng).map(p => ({
        id: p.id, type: 'place', title: p.name, lat: p.lat, lng: p.lng,
        category: p.category, coverImage: p.coverImage, rating: p.rating, source: 'opentripmap'
      }));
    } catch {
      // Fallback to static
      placeMarkers = staticPlaces.map(p => ({
        id: p.id, type: 'place', title: p.title, location: p.location,
        lat: p.lat, lng: p.lng, category: p.category, coverImage: p.image,
        rating: p.rating, priceDisplay: p.priceDisplay
      }));
    }

    const restaurantMarkers = restaurants.map(r => ({
      id: r.id, type: 'restaurant', title: r.title, location: r.location,
      lat: r.lat, lng: r.lng, category: r.category, coverImage: r.image, rating: r.rating
    }));

    const hotelMarkers = curatedHotels.map(h => ({
      id: h.id, type: 'hotel', title: h.title, location: h.location,
      lat: h.lat, lng: h.lng, category: h.category, coverImage: h.image, rating: h.rating
    }));

    let markers = [];
    if (!type || type === 'all') markers = [...placeMarkers, ...restaurantMarkers, ...hotelMarkers];
    else if (type === 'places') markers = placeMarkers;
    else if (type === 'restaurants') markers = restaurantMarkers;
    else if (type === 'hotels') markers = hotelMarkers;

    res.json({
      success: true,
      count: markers.length,
      mapView: { lat: 26.8, lng: 30.8, zoom: 5 },
      data: markers
    });
  } catch (error) {
    logger.error('Get explore map markers error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load map data' } });
  }
};

/**
 * GET /api/explore/search?q=pyramids&type=places
 */
exports.searchExplore = async (req, res) => {
  try {
    const { q, type } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Search query must be at least 2 characters' }
      });
    }

    const keyword = q.toLowerCase().trim();
    let results = [];

    if (!type || type === 'places' || type === 'all') {
      // Live search from OpenTripMap
      try {
        const livePlaces = await openTripMapService.searchByKeyword(q.trim(), 30);
        results = [...results, ...livePlaces.map(p => ({ ...p, type: 'place' }))];
      } catch {
        // Fallback to static
        const staticResults = staticPlaces
          .filter(p => p.title?.toLowerCase().includes(keyword) || p.location?.toLowerCase().includes(keyword))
          .map(p => ({ ...p, type: 'place' }));
        results = [...results, ...staticResults];
      }
    }

    if (!type || type === 'restaurants' || type === 'all') {
      const matchedRestaurants = restaurants
        .filter(r => r.title.toLowerCase().includes(keyword) || r.cuisine?.toLowerCase().includes(keyword))
        .map(r => ({ ...r, type: 'restaurant' }));
      results = [...results, ...matchedRestaurants];
    }

    if (!type || type === 'hotels' || type === 'all') {
      const matchedHotels = curatedHotels
        .filter(h => h.title.toLowerCase().includes(keyword) || h.location?.toLowerCase().includes(keyword))
        .map(h => ({ ...h, type: 'hotel' }));
      results = [...results, ...matchedHotels];
    }

    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    logger.error('Explore search error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Search failed' } });
  }
};
