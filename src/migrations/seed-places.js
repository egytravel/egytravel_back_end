/**
 * One-time seeder script to fetch all Egyptian places from OpenTripMap
 * and store them in the database with real photos.
 *
 * Run: node src/migrations/seed-places.js
 *
 * Rate limit: 1000 requests/day — script auto-pauses and resumes
 * Estimated time: 2-3 days for full Egypt coverage
 */

require('dotenv').config();
const axios = require('axios');
const { Sequelize, DataTypes } = require('sequelize');

const API_KEY = process.env.OPENTRIPMAP_API_KEY;
const BASE_URL = 'https://api.opentripmap.com/0.1/en/places';

// Egypt bounding box
const EGYPT_BOUNDS = { lonMin: 24.7, latMin: 21.9, lonMax: 37.2, latMax: 31.7 };

const CATEGORIES = {
  'Historical':    'historic,archaeology,cultural,architecture',
  'Religious':     'religion,churches,monasteries,mosques',
  'Nature':        'natural,national_parks,nature_reserves',
  'Sea & Water':   'beaches,water',
  'Culture':       'museums,theatres_and_entertainments,art_galleries',
  'Entertainment': 'amusements,zoos',
  'Landmarks':     'interesting_places,monuments'
};

// Fallback images by kind
const FALLBACK_IMAGES = {
  egyptian_temples: 'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=800',
  archaeology:      'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=800',
  historic:         'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800',
  religion:         'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800',
  beaches:          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
  water:            'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
  museums:          'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800',
  natural:          'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800',
  default:          'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=800'
};

function getFallback(kinds) {
  for (const k of kinds) { if (FALLBACK_IMAGES[k]) return FALLBACK_IMAGES[k]; }
  return FALLBACK_IMAGES.default;
}

// Sleep helper
const sleep = ms => new Promise(r => setTimeout(r, ms));

// DB connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

// Place model for seeding
const Place = sequelize.define('Place', {
  place_id:    { type: DataTypes.STRING(50), primaryKey: true },
  name:        { type: DataTypes.STRING(300), allowNull: false },
  category:    { type: DataTypes.STRING(100) },
  kinds:       { type: DataTypes.TEXT },
  lat:         { type: DataTypes.DECIMAL(10, 7) },
  lng:         { type: DataTypes.DECIMAL(10, 7) },
  cover_image: { type: DataTypes.TEXT },
  description: { type: DataTypes.TEXT },
  rating:      { type: DataTypes.DECIMAL(4, 1) },
  address:     { type: DataTypes.TEXT },
  city:        { type: DataTypes.STRING(100) },
  wikipedia_url: { type: DataTypes.TEXT },
  source:      { type: DataTypes.STRING(50), defaultValue: 'opentripmap' }
}, {
  tableName: 'places',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

let requestCount = 0;
const DAILY_LIMIT = 950; // Stay under 1000

async function checkRateLimit() {
  requestCount++;
  if (requestCount >= DAILY_LIMIT) {
    console.log(`\n⚠️  Approaching daily limit (${requestCount} requests). Pausing for 24 hours...`);
    console.log('💾 Progress saved. Re-run the script tomorrow to continue.\n');
    process.exit(0);
  }
  // Small delay between requests to be respectful
  await sleep(200);
}

async function fetchPlacesList(category, kinds, limit = 500) {
  await checkRateLimit();
  const response = await axios.get(`${BASE_URL}/bbox`, {
    params: {
      lon_min: EGYPT_BOUNDS.lonMin, lat_min: EGYPT_BOUNDS.latMin,
      lon_max: EGYPT_BOUNDS.lonMax, lat_max: EGYPT_BOUNDS.latMax,
      kinds, limit, format: 'json', apikey: API_KEY
    },
    timeout: 15000
  });
  return (response.data || []).filter(p => p.name && p.name.trim() !== '');
}

async function fetchPlaceDetail(xid) {
  await checkRateLimit();
  const response = await axios.get(`${BASE_URL}/xid/${xid}`, {
    params: { apikey: API_KEY },
    timeout: 10000
  });
  return response.data;
}

async function seedCategory(category, kinds) {
  console.log(`\n📍 Seeding category: ${category}`);

  const places = await fetchPlacesList(category, kinds, 500);
  console.log(`   Found ${places.length} places`);

  let saved = 0;
  let skipped = 0;

  for (const place of places) {
    // Skip if already in DB
    const existing = await Place.findByPk(place.xid);
    if (existing) { skipped++; continue; }

    let detail = null;
    let coverImage = getFallback(place.kinds ? place.kinds.split(',') : []);

    // Fetch detail to get real photo
    try {
      detail = await fetchPlaceDetail(place.xid);
      if (detail.preview?.source) {
        coverImage = detail.preview.source;
      }
    } catch (err) {
      // Use fallback if detail fetch fails
    }

    const kinds_arr = place.kinds ? place.kinds.split(',') : [];

    await Place.upsert({
      place_id:    place.xid,
      name:        place.name,
      category,
      kinds:       place.kinds || '',
      lat:         place.point?.lat || 0,
      lng:         place.point?.lon || 0,
      cover_image: coverImage,
      description: detail?.wikipedia_extracts?.text || detail?.info?.descr || '',
      rating:      place.rate ? parseFloat(place.rate) : null,
      address:     detail?.address
        ? [detail.address.road, detail.address.city].filter(Boolean).join(', ')
        : '',
      city:        detail?.address?.city || detail?.address?.town || '',
      wikipedia_url: detail?.wikipedia || null
    });

    saved++;
    if (saved % 10 === 0) {
      console.log(`   ✅ Saved ${saved}/${places.length} (${requestCount} API calls used)`);
    }
  }

  console.log(`   ✅ Category done: ${saved} saved, ${skipped} already existed`);
}

async function main() {
  console.log('🌍 EgyTravel Places Seeder');
  console.log('==========================');
  console.log(`API Key: ${API_KEY ? '✅ Set' : '❌ Missing'}`);

  if (!API_KEY) {
    console.error('❌ OPENTRIPMAP_API_KEY not set in .env');
    process.exit(1);
  }

  await sequelize.authenticate();
  console.log('✅ Database connected');

  await Place.sync({ alter: true });
  console.log('✅ Places table ready');

  const totalBefore = await Place.count();
  console.log(`📊 Places in DB before seeding: ${totalBefore}`);

  for (const [category, kinds] of Object.entries(CATEGORIES)) {
    await seedCategory(category, kinds);
  }

  const totalAfter = await Place.count();
  console.log(`\n🎉 Seeding complete!`);
  console.log(`📊 Total places in DB: ${totalAfter} (added ${totalAfter - totalBefore})`);
  console.log(`📡 Total API calls used: ${requestCount}`);

  await sequelize.close();
}

main().catch(err => {
  console.error('❌ Seeder failed:', err.message);
  process.exit(1);
});
