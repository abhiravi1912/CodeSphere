const express = require('express');
const {
  getMe,
  updateMe,
  changePassword,
  getUserById,
  searchUsers,
} = require('../controllers/userController');
const { getMyNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All user routes require authentication
router.use(protect);

// GET  /api/users/search?q=...  — Search users for project invitations
router.get('/search', searchUsers);

// GET  /api/users/me     — Get current user profile
router.get('/me', getMe);

// PUT  /api/users/me     — Update current user profile
router.put('/me', updateMe);

// PUT  /api/users/me/password — Change password
router.put('/me/password', changePassword);

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────

// GET   /api/users/me/notifications           — Get all notifications (unread first)
router.get('/me/notifications', getMyNotifications);

// PATCH /api/users/me/notifications/read-all  — Mark ALL as read
router.patch('/me/notifications/read-all', markAllAsRead);

// PATCH /api/users/me/notifications/:notifId/read — Mark one as read
router.patch('/me/notifications/:notifId/read', markAsRead);

// GET  /api/users/:id   — View another user's public profile
router.get('/:id', getUserById);

module.exports = router;
