const { places, restaurants, curatedHotels, popularFlightRoutes, placeCategories } = require('../data/exploreData');
const logger = require('../utils/logger');

/**
 * GET /api/explore
 * Full explore screen payload — places, recommended, restaurants, hotels, flights
 */
exports.getExploreData = async (req, res) => {
  try {
    const recommended = places.filter(p => p.isRecommended);
    const recent = places.slice(0, 6);

    res.json({
      success: true,
      data: {
        categories: placeCategories,
        places: recent,                    // Default "Recent" tab
        recommended,                       // Recommended section
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
 * GET /api/explore/places
 * Get places with optional category filter
 * ?category=Historical|Beaches|Religious|Entertainment|Nature & Adventure|Recent
 */
exports.getPlaces = async (req, res) => {
  try {
    const { category, limit } = req.query;
    const limitNum = parseInt(limit) || 20;

    let results = [...places];

    if (category && category !== 'Recent') {
      results = results.filter(p => p.category === category);
    }

    res.json({
      success: true,
      count: results.slice(0, limitNum).length,
      categories: placeCategories,
      data: results.slice(0, limitNum)
    });
  } catch (error) {
    logger.error('Get places error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load places' } });
  }
};

/**
 * GET /api/explore/places/:id
 * Get single place detail
 */
exports.getPlaceById = async (req, res) => {
  try {
    const { id } = req.params;
    const place = places.find(p => p.id === id);

    if (!place) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Place not found' } });
    }

    res.json({ success: true, data: place });
  } catch (error) {
    logger.error('Get place by id error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load place' } });
  }
};

/**
 * GET /api/explore/restaurants
 * Get all restaurants with optional city filter
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
    const { id } = req.params;
    const restaurant = restaurants.find(r => r.id === id);

    if (!restaurant) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Restaurant not found' } });
    }

    res.json({ success: true, data: restaurant });
  } catch (error) {
    logger.error('Get restaurant by id error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load restaurant' } });
  }
};

/**
 * GET /api/explore/hotels
 * Get curated hotels with optional city/category filter
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
    logger.error('Get curated hotels error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load hotels' } });
  }
};

/**
 * GET /api/explore/flights
 * Get popular flight routes
 */
exports.getPopularFlights = async (req, res) => {
  try {
    res.json({ success: true, count: popularFlightRoutes.length, data: popularFlightRoutes });
  } catch (error) {
    logger.error('Get popular flights error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load flights' } });
  }
};

/**
 * GET /api/explore/map
 * All explore items as map markers (places + restaurants + hotels)
 * Returns lightweight objects with lat/lng for map pins
 */
exports.getExploreMapMarkers = async (req, res) => {
  try {
    const { type } = req.query; // places | restaurants | hotels | all

    const placeMarkers = places.map(p => ({
      id: p.id, type: 'place', title: p.title, location: p.location,
      lat: p.lat, lng: p.lng, image: p.image, rating: p.rating,
      priceDisplay: p.priceDisplay, category: p.category
    }));

    const restaurantMarkers = restaurants.map(r => ({
      id: r.id, type: 'restaurant', title: r.title, location: r.location,
      lat: r.lat, lng: r.lng, image: r.image, rating: r.rating,
      priceDisplay: r.priceDisplay, category: r.category
    }));

    const hotelMarkers = curatedHotels.map(h => ({
      id: h.id, type: 'hotel', title: h.title, location: h.location,
      lat: h.lat, lng: h.lng, image: h.image, rating: h.rating,
      priceDisplay: h.priceDisplay, category: h.category
    }));

    let markers = [];
    if (!type || type === 'all') {
      markers = [...placeMarkers, ...restaurantMarkers, ...hotelMarkers];
    } else if (type === 'places') markers = placeMarkers;
    else if (type === 'restaurants') markers = restaurantMarkers;
    else if (type === 'hotels') markers = hotelMarkers;

    // Egypt center as default map view
    const mapView = { lat: 26.8, lng: 30.8, zoom: 5 };

    res.json({ success: true, count: markers.length, mapView, data: markers });
  } catch (error) {
    logger.error('Get explore map markers error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load map data' } });
  }
};

/**
 * GET /api/explore/search?q=pyramids
 * Search across places, restaurants, and hotels
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

    const matchedPlaces = places.filter(p =>
      p.title.toLowerCase().includes(keyword) ||
      p.location.toLowerCase().includes(keyword) ||
      p.category.toLowerCase().includes(keyword)
    ).map(p => ({ ...p, type: 'place' }));

    const matchedRestaurants = restaurants.filter(r =>
      r.title.toLowerCase().includes(keyword) ||
      r.location.toLowerCase().includes(keyword) ||
      r.cuisine.toLowerCase().includes(keyword)
    ).map(r => ({ ...r, type: 'restaurant' }));

    const matchedHotels = curatedHotels.filter(h =>
      h.title.toLowerCase().includes(keyword) ||
      h.location.toLowerCase().includes(keyword) ||
      h.category.toLowerCase().includes(keyword)
    ).map(h => ({ ...h, type: 'hotel' }));

    let results = [];
    if (!type || type === 'all') {
      results = [...matchedPlaces, ...matchedRestaurants, ...matchedHotels];
    } else if (type === 'places') results = matchedPlaces;
    else if (type === 'restaurants') results = matchedRestaurants;
    else if (type === 'hotels') results = matchedHotels;

    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    logger.error('Explore search error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Search failed' } });
  }
};
