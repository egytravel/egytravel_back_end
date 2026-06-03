const express = require('express');
const router = express.Router();
const axios = require('axios');
const { optionalAuth, authenticateToken } = require('../middleware/auth');
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
 * POST /api/ai/save-trip
 * Takes the AI plan response from Flutter and saves it as a real trip in the database
 * Flutter calls AI directly, gets the response, then calls this to persist it
 * Body: { title, startDate, itinerary: <full AI plan response> }
 */
router.post('/save-trip', authenticateToken, async (req, res) => {
  try {
    const { Trip, TripDay } = require('../models/sql');
    const userId = req.user.user_id;
    const { title, startDate, itinerary } = req.body;

    if (!itinerary || !itinerary.data) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMS', message: 'itinerary is required — pass the full AI /plan response as the itinerary field' }
      });
    }

    const aiDays = itinerary.data?.days || [];

    // Calculate end date from number of days
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(start.getDate() + Math.max(aiDays.length - 1, 0));

    // Create trip record
    const trip = await Trip.create({
      user_id: userId,
      title: title || `AI Trip (${aiDays.length} days)`,
      description: `AI-generated itinerary with ${aiDays.length} days`,
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
      status: 'planning',
      source: 'ai'
    });

    // Create day entries from AI response
    const dayEntries = aiDays.map((aiDay, i) => {
      const dayDate = new Date(start);
      dayDate.setDate(start.getDate() + i);

      // Extract locations if the AI returned place data
      const locations = (aiDay.places || []).filter(p => p.name).map(p => ({
        name: p.name,
        lat: p.lat || null,
        lng: p.lng || null,
        type: p.type || 'place',
        notes: p.description || null
      }));

      // Extract activities
      const activities = [];
      if (Array.isArray(aiDay.activities)) activities.push(...aiDay.activities);
      else if (aiDay.description) activities.push(aiDay.description);

      return {
        trip_id: trip.trip_id,
        day_number: i + 1,
        date: dayDate.toISOString().split('T')[0],
        title: aiDay.title || aiDay.day_title || `Day ${i + 1}`,
        description: aiDay.description || null,
        activities,
        locations,
        notes: aiDay.notes || null
      };
    });

    if (dayEntries.length > 0) {
      await TripDay.bulkCreate(dayEntries);
    }

    logger.info('AI trip saved', { tripId: trip.trip_id, userId, days: dayEntries.length });

    res.status(201).json({
      success: true,
      message: `AI trip saved with ${dayEntries.length} days`,
      data: {
        tripId: trip.trip_id,
        title: trip.title,
        startDate: trip.start_date,
        endDate: trip.end_date,
        source: 'ai',
        daysCreated: dayEntries.length
      }
    });
  } catch (error) {
    logger.error('Save AI trip error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to save AI trip: ' + error.message } });
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
