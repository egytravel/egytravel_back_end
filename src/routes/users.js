const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const AuthService = require('../services/authService');
const { User } = require('../models/sql');
const {
  validateProfileUpdate,
  validateChangePassword,
  validateDeleteAccount,
  validateNotificationUpdate
} = require('../middleware/validation');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleAuth');
const logger = require('../utils/logger');

// ─── Profile ────────────────────────────────────────────────────────────────

router.get('/profile', requireAuth, userController.getProfile);
router.put('/profile', requireAuth, validateProfileUpdate, userController.updateProfile);
router.delete('/profile', requireAuth, validateDeleteAccount, userController.deleteAccount);

// ─── Security ───────────────────────────────────────────────────────────────

router.post('/change-password', requireAuth, validateChangePassword, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await AuthService.changePassword(req.user.user_id, currentPassword, newPassword);
    res.json({ success: true, message: result.message });
  } catch (error) {
    logger.error('Change password error:', error);
    if (error.message.includes('incorrect')) {
      return res.status(400).json({ success: false, error: { code: 'INCORRECT_PASSWORD', message: 'Current password is incorrect' } });
    }
    res.status(500).json({ success: false, error: { code: 'CHANGE_PASSWORD_FAILED', message: 'Failed to change password' } });
  }
});

// ─── Notifications ──────────────────────────────────────────────────────────

router.get('/notifications', requireAuth, userController.getNotifications);
router.put('/notifications', requireAuth, validateNotificationUpdate, userController.updateNotifications);

// ─── Travel History ─────────────────────────────────────────────────────────

router.get('/travel-history', requireAuth, userController.getTravelHistory);

// ─── Admin ───────────────────────────────────────────────────────────────────

router.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { count, rows: users } = await User.findAndCountAll({ limit, offset, order: [['created_at', 'DESC']], attributes: { exclude: ['password'] } });
    res.json({ success: true, data: { users, pagination: { page, limit, total: count, pages: Math.ceil(count / limit) } } });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({ success: false, error: { code: 'GET_USERS_FAILED', message: 'Failed to get users list' } });
  }
});

router.get('/admin/users/:userId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(parseInt(req.params.userId), { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    res.json({ success: true, data: { user } });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({ success: false, error: { code: 'GET_USER_FAILED', message: 'Failed to get user' } });
  }
});

router.put('/admin/users/:userId/role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ success: false, error: { code: 'INVALID_ROLE', message: 'Role must be either user or admin' } });
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    if (user.user_id === req.user.user_id) return res.status(400).json({ success: false, error: { code: 'CANNOT_CHANGE_OWN_ROLE', message: 'You cannot change your own role' } });
    await user.update({ role });
    res.json({ success: true, message: 'User role updated successfully', data: { user: user.toJSON() } });
  } catch (error) {
    logger.error('Update user role error:', error);
    res.status(500).json({ success: false, error: { code: 'UPDATE_ROLE_FAILED', message: 'Failed to update user role' } });
  }
});

router.delete('/admin/users/:userId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    if (user.user_id === req.user.user_id) return res.status(400).json({ success: false, error: { code: 'CANNOT_DELETE_SELF', message: 'You cannot delete your own account' } });
    await user.destroy();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({ success: false, error: { code: 'DELETE_USER_FAILED', message: 'Failed to delete user' } });
  }
});

module.exports = router;
