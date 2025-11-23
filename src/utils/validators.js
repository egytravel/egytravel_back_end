/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} dateString - Date string to validate
 * @returns {boolean} Is valid
 */
function isValidDate(dateString) {
  if (!dateString) return false;
  
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

/**
 * Validate check-in date is before check-out date
 * @param {string} checkin - Check-in date
 * @param {string} checkout - Check-out date
 * @returns {boolean} Is valid
 */
function isValidDateRange(checkin, checkout) {
  if (!isValidDate(checkin) || !isValidDate(checkout)) {
    return false;
  }
  
  const checkinDate = new Date(checkin);
  const checkoutDate = new Date(checkout);
  
  return checkinDate < checkoutDate;
}

/**
 * Validate positive integer
 * @param {any} value - Value to validate
 * @returns {boolean} Is valid
 */
function isPositiveInteger(value) {
  const num = parseInt(value);
  return !isNaN(num) && num > 0 && Number.isInteger(num);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate booking status
 * @param {string} status - Status to validate
 * @returns {boolean} Is valid
 */
function isValidBookingStatus(status) {
  const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
  return validStatuses.includes(status);
}

/**
 * Validate item type for favorites
 * @param {string} type - Item type to validate
 * @returns {boolean} Is valid
 */
function isValidItemType(type) {
  const validTypes = ['hotel', 'place', 'itinerary', 'activity', 'restaurant', 'attraction', 'trip'];
  return validTypes.includes(type);
}

/**
 * Sanitize string input
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  return input.trim();
}

module.exports = {
  isValidDate,
  isValidDateRange,
  isPositiveInteger,
  isValidEmail,
  isValidBookingStatus,
  isValidItemType,
  sanitizeString
};
