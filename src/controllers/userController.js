const { User, Trip, Booking, Favorite } = require('../models/sql');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });

    const [tripsCount, favoritesCount] = await Promise.all([
      Trip.count({ where: { user_id: userId } }),
      Favorite.count({ where: { user_id: userId } })
    ]);

    res.json({ success: true, data: { user: user.toJSON(), stats: { trips_count: tripsCount, reviews_count: 0, favorites_count: favoritesCount } } });
  } catch (error) {
    logger.error('getProfile error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get profile' } });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { name, phone, nationality, date_of_birth, profile_photo_url } = req.body;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (nationality !== undefined) updates.nationality = nationality;
    if (date_of_birth !== undefined) updates.date_of_birth = date_of_birth;
    if (profile_photo_url !== undefined) updates.profile_photo_url = profile_photo_url;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No valid fields provided to update' } });
    }

    await user.update(updates);
    logger.info('Profile updated', { userId });
    res.json({ success: true, message: 'Profile updated successfully', data: { user: user.toJSON() } });
  } catch (error) {
    logger.error('updateProfile error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update profile' } });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Password confirmation is required' } });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ success: false, error: { code: 'INCORRECT_PASSWORD', message: 'Password is incorrect' } });

    await user.destroy();
    logger.info('Account deleted', { userId });
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    logger.error('deleteAccount error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete account' } });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id);
    if (!user) return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    const prefs = user.notification_preferences || { push_enabled: true, email_enabled: true };
    res.json({ success: true, data: prefs });
  } catch (error) {
    logger.error('getNotifications error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get notification preferences' } });
  }
};

exports.updateNotifications = async (req, res) => {
  try {
    const { push_enabled, email_enabled } = req.body;
    const user = await User.findByPk(req.user.user_id);
    if (!user) return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });

    const current = user.notification_preferences || { push_enabled: true, email_enabled: true };
    const updated = {
      push_enabled: push_enabled !== undefined ? push_enabled : current.push_enabled,
      email_enabled: email_enabled !== undefined ? email_enabled : current.email_enabled
    };

    await user.update({ notification_preferences: updated });
    logger.info('Notification preferences updated', { userId: req.user.user_id });
    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error('updateNotifications error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update notification preferences' } });
  }
};

exports.getTravelHistory = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const history = await Booking.findAll({
      where: { user_id: userId, status: ['completed', 'confirmed'] },
      attributes: ['booking_id', 'hotel_name', 'hotel_location', 'check_in_date', 'check_out_date', 'status', 'booking_url', 'booking_type', 'airline', 'departure_city', 'arrival_city'],
      order: [['check_in_date', 'DESC']]
    });
    res.json({ success: true, data: history.map(b => b.get({ plain: true })) });
  } catch (error) {
    logger.error('getTravelHistory error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get travel history' } });
  }
};
