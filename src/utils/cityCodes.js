/**
 * Egyptian City and Airport Codes Mapping
 * IATA codes for Amadeus API integration
 */

const egyptianCities = {
  // Major Cities
  'cairo': {
    cityCode: 'CAI',
    airportCode: 'CAI',
    name: 'Cairo',
    arabicName: 'القاهرة',
    airport: 'Cairo International Airport',
    region: 'Greater Cairo',
    popular: true
  },
  'giza': {
    cityCode: 'CAI',
    airportCode: 'CAI',
    name: 'Giza',
    arabicName: 'الجيزة',
    airport: 'Cairo International Airport',
    region: 'Greater Cairo',
    popular: true
  },
  'alexandria': {
    cityCode: 'ALY',
    airportCode: 'ALY',
    name: 'Alexandria',
    arabicName: 'الإسكندرية',
    airport: 'Borg El Arab Airport',
    region: 'Mediterranean Coast',
    popular: true
  },
  
  // Upper Egypt
  'luxor': {
    cityCode: 'LXR',
    airportCode: 'LXR',
    name: 'Luxor',
    arabicName: 'الأقصر',
    airport: 'Luxor International Airport',
    region: 'Upper Egypt',
    popular: true
  },
  'aswan': {
    cityCode: 'ASW',
    airportCode: 'ASW',
    name: 'Aswan',
    arabicName: 'أسوان',
    airport: 'Aswan International Airport',
    region: 'Upper Egypt',
    popular: true
  },
  
  // Red Sea Resorts
  'hurghada': {
    cityCode: 'HRG',
    airportCode: 'HRG',
    name: 'Hurghada',
    arabicName: 'الغردقة',
    airport: 'Hurghada International Airport',
    region: 'Red Sea',
    popular: true
  },
  'sharm el sheikh': {
    cityCode: 'SSH',
    airportCode: 'SSH',
    name: 'Sharm El Sheikh',
    arabicName: 'شرم الشيخ',
    airport: 'Sharm El Sheikh International Airport',
    region: 'Sinai',
    popular: true
  },
  'marsa alam': {
    cityCode: 'RMF',
    airportCode: 'RMF',
    name: 'Marsa Alam',
    arabicName: 'مرسى علم',
    airport: 'Marsa Alam International Airport',
    region: 'Red Sea',
    popular: true
  },
  
  // Other Cities
  'sphinx': {
    cityCode: 'SPX',
    airportCode: 'SPX',
    name: 'Sphinx',
    arabicName: 'أبو الهول',
    airport: 'Sphinx International Airport',
    region: 'Greater Cairo',
    popular: false
  },
  'taba': {
    cityCode: 'TCP',
    airportCode: 'TCP',
    name: 'Taba',
    arabicName: 'طابا',
    airport: 'Taba International Airport',
    region: 'Sinai',
    popular: false
  },
  'port said': {
    cityCode: 'PSD',
    airportCode: 'PSD',
    name: 'Port Said',
    arabicName: 'بورسعيد',
    airport: 'Port Said Airport',
    region: 'Canal Zone',
    popular: false
  },
  'sohag': {
    cityCode: 'HMB',
    airportCode: 'HMB',
    name: 'Sohag',
    arabicName: 'سوهاج',
    airport: 'Sohag International Airport',
    region: 'Upper Egypt',
    popular: false
  },
  'asyut': {
    cityCode: 'ATZ',
    airportCode: 'ATZ',
    name: 'Asyut',
    arabicName: 'أسيوط',
    airport: 'Asyut International Airport',
    region: 'Upper Egypt',
    popular: false
  }
};

/**
 * Get city information by name
 * @param {string} cityName - City name (case insensitive)
 * @returns {object|null} City information or null if not found
 */
function getCityByName(cityName) {
  const normalizedName = cityName.toLowerCase().trim();
  return egyptianCities[normalizedName] || null;
}

/**
 * Get city code (IATA) by city name
 * @param {string} cityName - City name
 * @returns {string|null} City code or null if not found
 */
function getCityCode(cityName) {
  const city = getCityByName(cityName);
  return city ? city.cityCode : null;
}

/**
 * Get airport code (IATA) by city name
 * @param {string} cityName - City name
 * @returns {string|null} Airport code or null if not found
 */
function getAirportCode(cityName) {
  const city = getCityByName(cityName);
  return city ? city.airportCode : null;
}

/**
 * Search cities by keyword
 * @param {string} keyword - Search keyword
 * @returns {Array} Array of matching cities
 */
function searchCities(keyword) {
  const keywordLower = keyword.toLowerCase().trim();
  
  return Object.entries(egyptianCities)
    .filter(([key, city]) => 
      key.includes(keywordLower) ||
      city.name.toLowerCase().includes(keywordLower) ||
      city.arabicName.includes(keyword) ||
      city.cityCode.toLowerCase().includes(keywordLower) ||
      city.airport.toLowerCase().includes(keywordLower)
    )
    .map(([key, city]) => city);
}

/**
 * Get all popular cities
 * @returns {Array} Array of popular cities
 */
function getPopularCities() {
  return Object.values(egyptianCities).filter(city => city.popular);
}

/**
 * Get all cities
 * @returns {Array} Array of all cities
 */
function getAllCities() {
  return Object.values(egyptianCities);
}

/**
 * Validate if a code is a valid Egyptian city/airport code
 * @param {string} code - IATA code
 * @returns {boolean} True if valid
 */
function isValidEgyptianCode(code) {
  const codeUpper = code.toUpperCase();
  return Object.values(egyptianCities).some(
    city => city.cityCode === codeUpper || city.airportCode === codeUpper
  );
}

/**
 * Get city by code
 * @param {string} code - IATA code
 * @returns {object|null} City information or null if not found
 */
function getCityByCode(code) {
  const codeUpper = code.toUpperCase();
  return Object.values(egyptianCities).find(
    city => city.cityCode === codeUpper || city.airportCode === codeUpper
  ) || null;
}

module.exports = {
  egyptianCities,
  getCityByName,
  getCityCode,
  getAirportCode,
  searchCities,
  getPopularCities,
  getAllCities,
  isValidEgyptianCode,
  getCityByCode
};
