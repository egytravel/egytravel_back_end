const axios = require('axios');
const cacheService = require('./cacheService');
const logger = require('../utils/logger');

const BASE_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary';

/**
 * Fetch a Wikipedia summary for a given search term
 * No API key needed — completely free
 * @param {string} searchTerm - Place name to look up
 * @returns {object|null} Wikipedia data or null if not found
 */
async function getWikipediaSummary(searchTerm) {
  const cacheKey = `wiki_${searchTerm.toLowerCase().replace(/\s+/g, '_')}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    // Wikipedia REST API uses the page title in the URL (spaces as underscores)
    const title = encodeURIComponent(searchTerm.replace(/\s+/g, '_'));
    const response = await axios.get(`${BASE_URL}/${title}`, {
      timeout: 8000,
      headers: {
        'User-Agent': 'EgyTravel/1.0 (travel app; contact@egytravel.com)'
      }
    });

    const data = response.data;

    const result = {
      title: data.title,
      description: data.description || '',
      extract: data.extract || '',           // Full summary paragraph(s)
      extractShort: data.extract
        ? data.extract.split('\n')[0]        // First paragraph only
        : '',
      thumbnail: data.thumbnail?.source || null,
      originalImage: data.originalimage?.source || null,
      wikipediaUrl: data.content_urls?.desktop?.page || null,
      coordinates: data.coordinates
        ? { lat: data.coordinates.lat, lng: data.coordinates.lon }
        : null
    };

    // Cache for 24 hours — Wikipedia content doesn't change often
    cacheService.set(cacheKey, result, 86400);
    return result;
  } catch (error) {
    if (error.response?.status === 404) {
      logger.debug('Wikipedia page not found', { searchTerm });
      return null;
    }
    logger.warn('Wikipedia API error', { searchTerm, error: error.message });
    return null; // fail silently — Wikipedia is enrichment, not critical
  }
}

/**
 * Enrich a destination object with Wikipedia data
 * Tries the destination name first, falls back to city name
 * @param {object} destination - Destination object with name and city fields
 * @returns {object} Destination enriched with wikipedia field
 */
async function enrichWithWikipedia(destination) {
  try {
    // Try exact name first
    let wiki = await getWikipediaSummary(destination.name);

    // If no result or very short extract, try with "Egypt" appended
    if (!wiki || wiki.extract.length < 100) {
      wiki = await getWikipediaSummary(`${destination.name}, Egypt`);
    }

    if (!wiki) return destination;

    // Use Wikipedia thumbnail as coverImage if the destination has none or uses a fallback
    const needsImage = !destination.coverImage ||
      destination.coverImage.includes('unsplash.com') ||
      destination.coverImage === null;

    const wikiImage = wiki.thumbnail || wiki.originalImage;

    return {
      ...destination,
      description: wiki.extract || destination.description,
      shortDescription: wiki.extractShort || destination.shortDescription,
      // Inject Wikipedia image if destination has no real image
      coverImage: (needsImage && wikiImage) ? wikiImage : destination.coverImage,
      images: (needsImage && wikiImage && (!destination.images || destination.images.length === 0))
        ? [wikiImage]
        : destination.images,
      wikipedia: {
        title: wiki.title,
        url: wiki.wikipediaUrl,
        thumbnail: wiki.thumbnail,
        originalImage: wiki.originalImage,
        coordinates: wiki.coordinates
      }
    };
  } catch (error) {
    logger.warn('Failed to enrich destination with Wikipedia', { name: destination.name });
    return destination; // return original if enrichment fails
  }
}

module.exports = { getWikipediaSummary, enrichWithWikipedia };
