const express = require('express');
const router = express.Router();
const axios = require('axios');
const { optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

const AI_BASE = 'https://fronic-egydocker.hf.space';

/**
 * POST /api/ai/chat
 * Proxy to AI chat endpoint
 */
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message, lat, lon } = req.body;
    const userId = req.user?.user_id?.toString() || req.body.user_id || 'guest';

    if (!message) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMS', message: 'message is required' } });
    }

    const response = await axios.post(`${AI_BASE}/chat`, {
      user_id: userId,
      message,
      lat: lat || 30.0444,
      lon: lon || 31.2357
    }, { timeout: 30000 });

    res.json({ success: true, data: response.data });
  } catch (error) {
    logger.error('AI chat error', { error: error.message });
    res.status(502).json({ success: false, error: { code: 'AI_ERROR', message: 'AI service unavailable' } });
  }
});

/**
 * POST /api/ai/plan
 * Accepts structured preferences, converts to natural language, sends to AI
 * Body: { destination, lat, lon, preferences: { budget, mood, interests[], days } }
 */
router.post('/plan', optionalAuth, async (req, res) => {
  try {
    const { destination, lat, lon, preferences = {} } = req.body;
    const userId = req.user?.user_id?.toString() || req.body.user_id || 'guest';

    const { budget = 'medium', mood, interests = [], days } = preferences;

    // Build natural language message from structured preferences
    const parts = [];

    if (days) parts.push(`${days} day trip`);
    else parts.push('trip');

    if (destination) parts.push(`in ${destination}`);

    if (interests.length > 0) {
      parts.push(`focused on ${interests.join(', ')}`);
    }

    if (mood) parts.push(`with a ${mood} vibe`);

    if (budget) {
      const budgetMap = { low: 'budget-friendly', medium: 'moderate budget', high: 'luxury' };
      parts.push(`on a ${budgetMap[budget] || budget} budget`);
    }

    const message = parts.join(' ');
    logger.info('AI plan request', { userId, message, lat, lon });

    const response = await axios.post(`${AI_BASE}/plan`, {
      user_id: userId,
      message,
      lat: lat || 30.0444,
      lon: lon || 31.2357
    }, { timeout: 60000 });

    res.json({
      success: true,
      message_sent: message,
      data: response.data
    });
  } catch (error) {
    logger.error('AI plan error', { error: error.message });
    res.status(502).json({ success: false, error: { code: 'AI_ERROR', message: 'AI service unavailable' } });
  }
});

/**
 * GET /api/ai/state/:userId
 * Get AI session state for a user
 */
router.get('/state/:userId', async (req, res) => {
  try {
    const response = await axios.get(`${AI_BASE}/state/${req.params.userId}`, { timeout: 10000 });
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(502).json({ success: false, error: { code: 'AI_ERROR', message: 'AI service unavailable' } });
  }
});

/**
 * GET /api/ai/health
 * Check AI service health
 */
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${AI_BASE}/`, { timeout: 10000 });
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(502).json({ success: false, error: { code: 'AI_ERROR', message: 'AI service unavailable' } });
  }
});

module.exports = router;
