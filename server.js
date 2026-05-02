// EgyTravel Authentication Backend Server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import configurations
const sequelize = require('./src/config/database');
const connectMongoDB = require('./src/config/mongodb');
const logger = require('./src/utils/logger');

// Import routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const homeRoutes = require('./src/routes/home');
const exploreRoutes = require('./src/routes/explore');
const hotelRoutes = require('./src/routes/hotels');
const flightRoutes = require('./src/routes/flights');
const bookingRoutes = require('./src/routes/bookings');
const favoriteRoutes = require('./src/routes/favorites');
const reviewRoutes = require('./src/routes/reviews');
const communityRoutes = require('./src/routes/community');
const tripRoutes = require('./src/routes/trips');
const eventRoutes = require('./src/routes/events');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust Heroku's proxy (required for rate limiting and IP detection)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: '*',
  credentials: false
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (logo, etc.)
app.use(express.static('public'));

// Health check endpoint (before rate limiting)
app.get('/health', async (req, res) => {
  console.log('🏥 Health check requested');
  
  let dbStatus = 'disconnected';
  try {
    await sequelize.authenticate();
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'error: ' + error.message;
  }
  
  res.status(200).json({
    success: true,
    message: 'EgyTravel Auth Service is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    uptime: Math.floor(process.uptime()),
    database: dbStatus,
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'EgyTravel Authentication API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      users: '/api/users/*',
      home: '/api/home/*',
      hotels: '/api/hotels/*',
      flights: '/api/flights/*',
      bookings: '/api/bookings/*',
      favorites: '/api/favorites/*'
    }
  });
});

// Rate limiting for API routes only (relaxed for testing)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // limit each IP to 1000 requests per windowMs for testing
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    }
  }
});

// API routes with rate limiting
app.use('/api/auth', limiter, authRoutes);
app.use('/api/users', limiter, userRoutes);
app.use('/api/home', homeRoutes);           // Homescreen data (public, no rate limit needed)
app.use('/api/explore', exploreRoutes);     // Explore screen data (public)
app.use('/api/hotels', hotelRoutes);        // Hotels have their own rate limiting
app.use('/api/flights', flightRoutes);      // Flights have their own rate limiting
app.use('/api/bookings', limiter, bookingRoutes);
app.use('/api/favorites', limiter, favoriteRoutes);
app.use('/api/trips', limiter, tripRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/events', eventRoutes);

// ─── Google Places Photo Proxy ────────────────────────────────────────────────
// GET /api/places/photo?ref=PHOTO_REFERENCE&maxwidth=800
// Proxies Google photo requests server-side so the API key is never exposed to clients
app.get('/api/places/photo', async (req, res) => {
  const { ref, maxwidth = 800 } = req.query;
  if (!ref) return res.status(400).json({ error: 'ref parameter is required' });
  if (!process.env.GOOGLE_PLACES_API_KEY) return res.status(503).json({ error: 'Photo service not configured' });

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/photo', {
      params: { maxwidth, photo_reference: ref, key: process.env.GOOGLE_PLACES_API_KEY },
      responseType: 'stream',
      timeout: 10000,
      maxRedirects: 5
    });
    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // cache 24h in browser
    response.data.pipe(res);
  } catch (error) {
    logger.error('Photo proxy error', { ref: ref?.substring(0, 20), error: error.message });
    res.status(502).json({ error: 'Failed to fetch photo' });
  }
});

// ─── General Image Proxy ──────────────────────────────────────────────────────
// GET /api/image-proxy?url=ENCODED_URL
// Proxies any external image through our server so Flutter can load it reliably
// Handles CDN URLs from Booking.com, airline logos, etc.
app.get('/api/image-proxy', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url parameter is required' });

  // Only allow known safe domains
  const allowedDomains = [
    'cf.bstatic.com',       // Booking.com hotel photos
    'q-xx.bstatic.com',     // Booking.com CDN
    't-cf.bstatic.com',     // Booking.com CDN
    'r-xx.bstatic.com',     // Booking.com CDN
    'logos.skyscnr.com',    // Skyscanner airline logos
    'images.kiwi.com',      // Kiwi.com
    'content.r9cdn.net',    // Booking.com flights
    'booking.com',          // General Booking.com
  ];

  let decodedUrl;
  try {
    decodedUrl = decodeURIComponent(url);
    const urlObj = new URL(decodedUrl);
    const isAllowed = allowedDomains.some(d => urlObj.hostname.includes(d));
    if (!isAllowed) {
      return res.status(403).json({ error: 'Domain not allowed' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const response = await axios.get(decodedUrl, {
      responseType: 'stream',
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EgyTravel/1.0)',
        'Accept': 'image/*'
      }
    });
    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    response.data.pipe(res);
  } catch (error) {
    logger.error('Image proxy error', { url: decodedUrl?.substring(0, 60), error: error.message });
    res.status(502).json({ error: 'Failed to fetch image' });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested route was not found'
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An internal server error occurred' 
        : err.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    }
  });
});

// Database connection and server startup
const startServer = async () => {
  try {
    console.log('🚀 Starting EgyTravel Auth Server...');
    console.log('📊 Environment:', process.env.NODE_ENV || 'development');
    console.log('🔌 Port:', PORT);
    
    // Log environment variables (without sensitive data)
    console.log('🔧 Database Host:', process.env.DB_HOST ? 'Set' : 'Missing');
    console.log('🔧 Database Port:', process.env.DB_PORT ? 'Set' : 'Missing');
    console.log('🔧 Database Name:', process.env.DB_NAME ? 'Set' : 'Missing');
    console.log('🔧 JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'Missing');
    
    // Start server first (so health check works)
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ EgyTravel Auth Server running on port ${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ Health check available at: /health`);
      logger.info(`EgyTravel Auth Server running on port ${PORT}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      logger.error('Server error:', error);
      process.exit(1);
    });

    // Try to connect to database after server starts
    try {
      console.log('🔄 Attempting database connection...');
      const { syncDatabase } = require('./src/models/sql/index');
      await syncDatabase();
      console.log('✅ Database connected successfully');
    } catch (dbError) {
      console.error('⚠️ Database connection failed:', dbError.message);
      console.log('🔄 Server will continue running without database');
      console.log('📝 Check your environment variables in Railway dashboard');
    }
    
    // Connect to MongoDB (optional)
    try {
      await connectMongoDB();
    } catch (mongoError) {
      console.log('ℹ️ MongoDB connection skipped:', mongoError.message);
    }
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;