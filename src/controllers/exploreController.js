const { places: staticPlaces, restaurants, curatedHotels, popularFlightRoutes } = require('../data/exploreData');
const openTripMapService = require('../services/openTripMapService');
const bookingHotelService = require('../services/bookingComRapidService');
const bookingFlightService = require('../services/bookingComFlightService');
const { getWikipediaSummary } = require('../services/wikipediaService');
const { getReviewsForDestination } = require('../services/googlePlacesService');
const logger = require('../utils/logger');

// Default search params for explore screen (today + 2 days)
function getDefaultDates() {
  const checkin = new Date();
  checkin.setDate(checkin.getDate() + 7); // 1 week from now
  const checkout = new Date(checkin);
  checkout.setDate(checkout.getDate() + 2);
  return {
    checkin: checkin.toISOString().split('T')[0],
    checkout: checkout.toISOString().split('T')[0]
  };
}

// Categories available for filtering
const CATEGORIES = ['All', 'Historical', 'Religious', 'Nature', 'Sea & Water', 'Culture', 'Entertainment', 'Landmarks'];

/**
 * GET /api/explore
 * Full explore screen — static popular places + live hotels + live flights
 */
exports.getExploreData = async (req, res) => {
  try {
    const { checkin, checkout } = getDefaultDates();

    // Fetch real hotels for Cairo (most popular city) in parallel with flights
    let hotels = curatedHotels.slice(0, 4); // fallback
    let flights = popularFlightRoutes;       // fallback

    const [hotelsResult, flightsResult] = await Promise.allSettled([
      bookingHotelService.searchHotels({ cityCode: 'CAI', checkin, checkout, adults: 2, rooms: 1 }),
      bookingFlightService.searchFlights({ origin: 'CAI', destination: 'LXR', departureDate: checkin, adults: 1 })
    ]);

    if (hotelsResult.status === 'fulfilled' && hotelsResult.value.length > 0) {
      hotels = hotelsResult.value.slice(0, 4);
    }
    if (flightsResult.status === 'fulfilled' && flightsResult.value.length > 0) {
      flights = flightsResult.value.slice(0, 4);
    }

    res.json({
      success: true,
      data: {
        categories: CATEGORIES,
        popularPlaces: staticPlaces,
        restaurants: restaurants.slice(0, 4),
        hotels,
        flights
      }
    });
  } catch (error) {
    logger.error('Get explore data error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load explore data' } });
  }
};

/**
 * GET /api/explore/places?category=Historical&page=1&pageSize=20&city=cairo
 * Live places from OpenTripMap with real images, paginated
 */
exports.getPlaces = async (req, res) => {
  try {
    const { category = 'All', city, page = 1, pageSize = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSizeNum = Math.min(parseInt(pageSize) || 20, 40);

    // City-specific request
    if (city) {
      try {
        const places = await openTripMapService.getCityPlaces(city.toLowerCase(), category, 100);
        const offset = (pageNum - 1) * pageSizeNum;
        const pagePlaces = places.slice(offset, offset + pageSizeNum);

        return res.json({
          success: true,
          source: 'opentripmap',
          category,
          city,
          page: pageNum,
          pageSize: pageSizeNum,
          hasMore: offset + pageSizeNum < places.length,
          total: places.length,
          categories: CATEGORIES,
          data: pagePlaces
        });
      } catch (err) {
        logger.warn('OpenTripMap city places failed, falling back to static', { city, err: err.message });
      }
    }

    // Category request with real images via detail API
    try {
      const result = await openTripMapService.getPlacesWithImages(category, pageNum, pageSizeNum);
      return res.json({
        success: true,
        source: 'opentripmap',
        category,
        page: result.page,
        pageSize: result.pageSize,
        hasMore: result.hasMore,
        total: result.total,
        categories: CATEGORIES,
        data: result.data
      });
    } catch (err) {
      logger.warn('OpenTripMap places with images failed, falling back to static', { err: err.message });
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
      page: pageNum,
      pageSize: pageSizeNum,
      hasMore: false,
      total: results.length,
      categories: CATEGORIES,
      data: results.slice((pageNum - 1) * pageSizeNum, pageNum * pageSizeNum)
    });
  } catch (error) {
    logger.error('Get places error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load places' } });
  }
};

/**
 * GET /api/explore/places/:id
 * Single place — checks static first, then OpenTripMap, enriches with Google
 */
exports.getPlaceById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check static data first
    let place = staticPlaces.find(p => p.id === id);
    let source = 'static';

    if (!place) {
      // Try OpenTripMap (xid)
      try {
        place = await openTripMapService.getPlaceDetails(id);
        source = 'opentripmap';
      } catch (err) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Place not found' } });
      }
    }

    // Enrich with Google Places — real photos and reviews
    let googleData = null;
    if (process.env.GOOGLE_PLACES_API_KEY && place.lat && place.lng) {
      googleData = await getReviewsForDestination(
        id,
        place.name || place.title,
        place.lat,
        place.lng
      );
    }

    const enriched = { ...place };

    // Google photos replace static images
    if (googleData?.photos?.length) {
      const googlePhotoUrls = googleData.photos.map(p => p.url);
      enriched.images = googlePhotoUrls;
      enriched.coverImage = googlePhotoUrls[0];
    }

    if (googleData) {
      enriched.googleRating = googleData.rating;
      enriched.googleReviews = googleData.reviews;
      enriched.address = googleData.address || enriched.address;
      if (googleData.location) {
        enriched.lat = googleData.location.lat;
        enriched.lng = googleData.location.lng;
        enriched.mapLocation = googleData.location;
      }
      if (googleData.openingHours?.length) enriched.openingHours = googleData.openingHours;
    }

    return res.json({ success: true, source, data: enriched });
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
 * GET /api/explore/hotels?city=cairo&checkin=2026-06-01&checkout=2026-06-03&guests=2
 * Real hotels from Booking.com, falls back to curated static data
 */
exports.getCuratedHotels = async (req, res) => {
  try {
    const { city, checkin, checkout, guests, rooms, page } = req.query;
    const { checkin: defaultCheckin, checkout: defaultCheckout } = getDefaultDates();

    // Map city name to IATA code
    const cityCodeMap = {
      cairo: 'CAI', luxor: 'LXR', aswan: 'ASW',
      'sharm-el-sheikh': 'SSH', hurghada: 'HRG', alexandria: 'ALY',
      sharm: 'SSH'
    };

    const cityCode = city
      ? (cityCodeMap[city.toLowerCase()] || city.toUpperCase())
      : 'CAI';

    try {
      const results = await bookingHotelService.searchHotels({
        cityCode,
        checkin: checkin || defaultCheckin,
        checkout: checkout || defaultCheckout,
        adults: guests ? parseInt(guests) : 2,
        rooms: rooms ? parseInt(rooms) : 1,
        page: page ? parseInt(page) : 0
      });

      return res.json({
        success: true,
        source: 'booking.com',
        city: cityCode,
        count: results.length,
        data: results
      });
    } catch (err) {
      logger.warn('Booking.com hotels failed, falling back to static', { err: err.message });
      // Fallback to static curated data
      let fallback = [...curatedHotels];
      if (city) fallback = fallback.filter(h => h.city.toLowerCase() === city.toLowerCase());
      return res.json({ success: true, source: 'static', count: fallback.length, data: fallback });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load hotels' } });
  }
};

/**
 * GET /api/explore/flights?origin=CAI&destination=LXR&date=2026-06-01
 * Real flights from Booking.com, falls back to static popular routes
 */
exports.getPopularFlights = async (req, res) => {
  try {
    const { origin = 'CAI', destination = 'LXR', date, adults = '1', travelClass = 'ECONOMY' } = req.query;
    const { checkin: defaultDate } = getDefaultDates();

    try {
      const results = await bookingFlightService.searchFlights({
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        departureDate: date || defaultDate,
        adults: parseInt(adults),
        cabinClass: travelClass.toUpperCase()
      });

      return res.json({
        success: true,
        source: 'booking.com',
        count: results.length,
        data: results
      });
    } catch (err) {
      logger.warn('Booking.com flights failed, falling back to static', { err: err.message });
      return res.json({ success: true, source: 'static', count: popularFlightRoutes.length, data: popularFlightRoutes });
    }
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
