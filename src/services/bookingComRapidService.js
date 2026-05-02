const axios = require('axios');
const cacheService = require('./cacheService');
const logger = require('../utils/logger');

const BASE_URL = 'https://booking-com.p.rapidapi.com/v1';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'booking-com.p.rapidapi.com';
const APP_URL = process.env.APP_URL || 'https://egy-travel-89eca3b6683d.herokuapp.com';

// Wrap a Booking.com CDN URL through our image proxy so Flutter can load it reliably
// Uses base64 encoding to avoid URL parsing issues with special characters
function proxyImage(url) {
  if (!url) return null;
  const encoded = Buffer.from(url).toString('base64url'); // base64url = no +/= chars
  return `${APP_URL}/api/image-proxy?b64=${encoded}`;
}

// Egyptian city destination IDs from Booking.com
const CITY_DEST_IDS = {
  CAI: { id: '-290692', name: 'Cairo' },
  LXR: { id: '-290821', name: 'Luxor' },
  ASW: { id: '-291535', name: 'Aswan' },
  SSH: { id: '-302053', name: 'Sharm El Sheikh' },
  HRG: { id: '-290029', name: 'Hurghada' },
  ALY: { id: '-290263', name: 'Alexandria' },
  // Also support city name lookup
  cairo:            { id: '-290692', name: 'Cairo' },
  luxor:            { id: '-290821', name: 'Luxor' },
  aswan:            { id: '-291535', name: 'Aswan' },
  'sharm-el-sheikh':{ id: '-302053', name: 'Sharm El Sheikh' },
  hurghada:         { id: '-290029', name: 'Hurghada' },
  alexandria:       { id: '-290263', name: 'Alexandria' }
};

const headers = () => ({
  'X-RapidAPI-Key': RAPIDAPI_KEY,
  'X-RapidAPI-Host': RAPIDAPI_HOST
});

/**
 * Search hotels by city
 */
async function searchHotels({ cityCode, checkin, checkout, adults = 2, rooms = 1, page = 0 }) {
  if (!RAPIDAPI_KEY) throw new Error('RAPIDAPI_KEY not configured');

  const city = CITY_DEST_IDS[cityCode] || CITY_DEST_IDS[cityCode?.toLowerCase()];
  if (!city) throw new Error(`City code '${cityCode}' not supported`);

  const cacheKey = `booking_search_${cityCode}_${checkin}_${checkout}_${adults}_${rooms}_${page}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${BASE_URL}/hotels/search`, {
      params: {
        dest_id: city.id,
        dest_type: 'city',
        checkin_date: checkin,
        checkout_date: checkout,
        adults_number: String(adults),
        room_number: String(rooms),
        order_by: 'popularity',
        units: 'metric',
        locale: 'en-gb',
        currency: 'USD',
        filter_by_currency: 'USD',
        page_number: String(page)
      },
      headers: headers(),
      timeout: 15000
    });

    const results = (response.data.result || []).map(formatHotel);
    cacheService.set(cacheKey, results, 3600); // cache 1 hour
    return results;
  } catch (error) {
    logger.error('Booking.com hotel search failed', { cityCode, error: error.response?.data || error.message });
    throw error;
  }
}

/**
 * Get hotel details by hotel_id
 */
async function getHotelDetails(hotelId, { checkin, checkout, adults = 2, rooms = 1 }) {
  if (!RAPIDAPI_KEY) throw new Error('RAPIDAPI_KEY not configured');

  const cacheKey = `booking_detail_${hotelId}_${checkin}_${checkout}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${BASE_URL}/hotels/hotel-description`, {
      params: { hotel_id: hotelId, locale: 'en-gb' },
      headers: headers(),
      timeout: 15000
    });

    const detail = formatHotelDetail(response.data, hotelId, checkin, checkout, adults, rooms);
    cacheService.set(cacheKey, detail, 7200);
    return detail;
  } catch (error) {
    logger.error('Booking.com hotel details failed', { hotelId, error: error.response?.data || error.message });
    throw error;
  }
}

/**
 * Get hotel photos
 */
async function getHotelPhotos(hotelId) {
  if (!RAPIDAPI_KEY) return [];

  const cacheKey = `booking_photos_${hotelId}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${BASE_URL}/hotels/photos`, {
      params: { hotel_id: hotelId, locale: 'en-gb' },
      headers: headers(),
      timeout: 10000
    });

    const photos = (response.data || []).slice(0, 10).map(p => {
      const raw = p.url_max?.replace('{size}', '800x600') || p.url_original || p.url_square60;
      return proxyImage(raw);
    }).filter(Boolean);

    cacheService.set(cacheKey, photos, 86400);
    return photos;
  } catch (error) {
    logger.warn('Booking.com photos failed', { hotelId, error: error.message });
    return [];
  }
}

// ─── Formatters ──────────────────────────────────────────────────────────────

function formatHotel(h) {
  return {
    hotelId: String(h.hotel_id),
    name: h.hotel_name,
    city: h.city,
    country: h.country_trans || 'Egypt',
    address: h.address || '',
    lat: h.latitude || 0,
    lng: h.longitude || 0,
    rating: h.review_score || 0,
    reviewCount: h.review_nr || 0,
    reviewWord: h.review_score_word || '',
    stars: h.class || 0,
    price: {
      amount: h.min_total_price || 0,
      currency: h.currency_code || 'USD',
      perNight: true
    },
    coverImage: proxyImage(h.main_photo_url?.replace('square60', 'max1280x900')),
    thumbnail: proxyImage(h.main_photo_url),
    available: true,
    bookingUrl: `https://www.booking.com/hotel/${h.url?.split('/hotel/')[1] || ''}`,
    source: 'booking.com'
  };
}

function formatHotelDetail(data, hotelId, checkin, checkout, adults, rooms) {
  return {
    hotelId: String(hotelId),
    name: data.hotel_name || '',
    description: data.description || data.description_translations?.[0]?.description || '',
    city: data.city || '',
    country: data.country || 'Egypt',
    address: data.address || '',
    lat: data.location?.latitude || 0,
    lng: data.location?.longitude || 0,
    stars: data.class || 0,
    checkin: checkin,
    checkout: checkout,
    adults,
    rooms,
    bookingUrl: `https://www.booking.com/hotel/eg/${hotelId}.html?checkin=${checkin}&checkout=${checkout}&group_adults=${adults}&no_rooms=${rooms}`,
    source: 'booking.com'
  };
}

module.exports = { searchHotels, getHotelDetails, getHotelPhotos, CITY_DEST_IDS };
