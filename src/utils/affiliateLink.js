const bookingConfig = require('../config/bookingcom');

/**
 * Generate Booking.com affiliate link
 * @param {object} params - Booking parameters
 * @param {string} params.hotelId - Hotel ID
 * @param {string} params.checkin - Check-in date (YYYY-MM-DD)
 * @param {string} params.checkout - Check-out date (YYYY-MM-DD)
 * @param {number} params.guests - Number of guests
 * @param {number} params.rooms - Number of rooms
 * @returns {string} Affiliate link
 */
function generateAffiliateLink({ hotelId, checkin, checkout, guests = 2, rooms = 1 }) {
  if (!hotelId || !checkin || !checkout) {
    throw new Error('Missing required parameters: hotelId, checkin, checkout');
  }

  const baseUrl = 'https://www.booking.com/hotel/eg';

  const paramObj = {
    checkin,
    checkout,
    group_adults: guests,
    no_rooms: rooms,
    selected_currency: 'USD'
  };

  // Include affiliate ID only if configured
  if (bookingConfig.affiliateId) {
    paramObj.aid = bookingConfig.affiliateId;
  }

  const params = new URLSearchParams(paramObj);
  return `${baseUrl}/${hotelId}.html?${params.toString()}`;
}

/**
 * Validate affiliate link contains required parameters
 * @param {string} link - Affiliate link to validate
 * @returns {boolean} True if valid
 */
function validateAffiliateLink(link) {
  try {
    const url = new URL(link);
    
    // Check if link contains affiliate ID
    const aid = url.searchParams.get('aid');
    if (!aid || aid !== bookingConfig.affiliateId) {
      return false;
    }
    
    // Check if link contains required booking parameters
    const checkin = url.searchParams.get('checkin');
    const checkout = url.searchParams.get('checkout');
    
    if (!checkin || !checkout) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Extract booking parameters from affiliate link
 * @param {string} link - Affiliate link
 * @returns {object} Extracted parameters
 */
function extractParamsFromLink(link) {
  try {
    const url = new URL(link);
    
    return {
      checkin: url.searchParams.get('checkin'),
      checkout: url.searchParams.get('checkout'),
      guests: parseInt(url.searchParams.get('group_adults')) || 2,
      rooms: parseInt(url.searchParams.get('no_rooms')) || 1,
      currency: url.searchParams.get('selected_currency') || 'USD'
    };
  } catch (error) {
    return null;
  }
}

module.exports = {
  generateAffiliateLink,
  validateAffiliateLink,
  extractParamsFromLink
};
