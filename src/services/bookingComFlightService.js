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
  const encoded = Buffer.from(url).toString('base64url');
  return `${APP_URL}/api/image-proxy?b64=${encoded}`;
}

// Egyptian airport codes mapped to Booking.com format
const AIRPORT_CODES = {
  CAI: 'CAI.AIRPORT',
  LXR: 'LXR.AIRPORT',
  ASW: 'ASW.AIRPORT',
  SSH: 'SSH.AIRPORT',
  HRG: 'HRG.AIRPORT',
  ALY: 'ALY.AIRPORT',
  MUH: 'MUH.AIRPORT',
  SPX: 'SPX.AIRPORT'
};

const headers = () => ({
  'X-RapidAPI-Key': RAPIDAPI_KEY,
  'X-RapidAPI-Host': RAPIDAPI_HOST
});

/**
 * Search flights
 */
async function searchFlights({ origin, destination, departureDate, returnDate, adults = 1, cabinClass = 'ECONOMY' }) {
  if (!RAPIDAPI_KEY) throw new Error('RAPIDAPI_KEY not configured');

  const fromCode = AIRPORT_CODES[origin.toUpperCase()] || `${origin.toUpperCase()}.AIRPORT`;
  const toCode = AIRPORT_CODES[destination.toUpperCase()] || `${destination.toUpperCase()}.AIRPORT`;
  const flightType = returnDate ? 'ROUNDTRIP' : 'ONEWAY';

  const cacheKey = `flight_search_${origin}_${destination}_${departureDate}_${returnDate || ''}_${adults}_${cabinClass}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const params = {
      from_code: fromCode,
      to_code: toCode,
      depart_date: departureDate,
      adults: String(adults),
      flight_type: flightType,
      cabin_class: cabinClass.toUpperCase(),
      order_by: 'BEST',
      locale: 'en-gb',
      currency: 'USD'
    };

    if (returnDate) params.return_date = returnDate;

    const response = await axios.get(`${BASE_URL}/flights/search`, {
      params,
      headers: headers(),
      timeout: 20000
    });

    const results = (response.data.flightOffers || []).map(f => formatFlight(f, origin, destination));
    cacheService.set(cacheKey, results, 1800); // cache 30 min
    return results;
  } catch (error) {
    logger.error('Booking.com flight search failed', { origin, destination, error: error.response?.data || error.message });
    throw error;
  }
}

/**
 * Search airport locations by keyword
 */
async function searchLocations(keyword) {
  if (!RAPIDAPI_KEY) throw new Error('RAPIDAPI_KEY not configured');

  const cacheKey = `flight_locations_${keyword}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${BASE_URL}/flights/locations`, {
      params: { name: keyword, locale: 'en-gb' },
      headers: headers(),
      timeout: 10000
    });

    const results = (response.data || []).map(loc => ({
      code: loc.code,
      iataCode: loc.city || loc.short_code,
      name: loc.name,
      city: loc.cityName,
      country: loc.countryName,
      type: loc.type,
      image: loc.photoUri || null
    }));

    cacheService.set(cacheKey, results, 86400);
    return results;
  } catch (error) {
    logger.error('Booking.com flight locations failed', { keyword, error: error.message });
    throw error;
  }
}

// ─── Formatter ───────────────────────────────────────────────────────────────

function formatFlight(offer, originCode, destCode) {
  const seg = offer.segments?.[0];
  const leg = seg?.legs?.[0];
  const price = offer.priceBreakdown?.total;

  return {
    flightId: offer.token || offer.id,
    airline: {
      name: leg?.carriersData?.[0]?.name || '',
      code: leg?.carriersData?.[0]?.code || '',
      logo: proxyImage(leg?.carriersData?.[0]?.logo)
    },
    flightNumber: `${leg?.flightInfo?.carrierInfo?.operatingCarrier || ''}${leg?.flightInfo?.flightNumber || ''}`,
    departure: {
      airport: leg?.departureAirport?.code || originCode,
      city: leg?.departureAirport?.cityName || '',
      time: leg?.departureTime || '',
      terminal: leg?.departureAirport?.terminal || ''
    },
    arrival: {
      airport: leg?.arrivalAirport?.code || destCode,
      city: leg?.arrivalAirport?.cityName || '',
      time: leg?.arrivalTime || '',
      terminal: leg?.arrivalAirport?.terminal || ''
    },
    duration: seg?.totalTime ? `${Math.floor(seg.totalTime / 60)}h ${seg.totalTime % 60}m` : '',
    stops: (seg?.legs?.length || 1) - 1,
    cabinClass: leg?.cabinClass || 'ECONOMY',
    price: {
      amount: price ? (price.units + price.nanos / 1e9) : 0,
      currency: price?.currencyCode || 'USD'
    },
    baggage: offer.includedCheckedBags || null,
    bookingToken: offer.token,
    // Build a proper Booking.com flight search URL with the actual route and date
    // The token-based URL doesn't work publicly — use the search URL instead
    bookingUrl: (() => {
      const from = leg?.departureAirport?.code || originCode;
      const to = leg?.arrivalAirport?.code || destCode;
      const date = leg?.departureTime ? leg.departureTime.split('T')[0] : '';
      if (from && to && date) {
        return `https://www.booking.com/flights/search.html?from=${from}&to=${to}&depart=${date}&adults=1&type=ONEWAY`;
      }
      return `https://www.booking.com/flights/search.html?from=${originCode}&to=${destCode}`;
    })(),
    source: 'booking.com'
  };
}

module.exports = { searchFlights, searchLocations, AIRPORT_CODES };
