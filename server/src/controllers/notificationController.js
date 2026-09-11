const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// ─────────────────────────────────────────────────────────────
// GET /api/users/me/notifications
// Fetch the current user's notifications (unread first).
// ─────────────────────────────────────────────────────────────
const getMyNotifications = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
        take: Number(limit),
      }),
      prisma.notification.count({
        where: { userId: req.user.id, isRead: false },
      }),
    ]);

    return successResponse(res, 'Notifications retrieved.', { notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/users/me/notifications/:notifId/read
// Mark a single notification as read.
// ─────────────────────────────────────────────────────────────
const markAsRead = async (req, res, next) => {
  try {
    const { notifId } = req.params;

    const notif = await prisma.notification.findUnique({ where: { id: notifId } });

    if (!notif) return errorResponse(res, 'Notification not found.', 404);
    if (notif.userId !== req.user.id) {
      return errorResponse(res, 'You can only manage your own notifications.', 403);
    }

    const updated = await prisma.notification.update({
      where: { id: notifId },
      data: { isRead: true },
    });

    return successResponse(res, 'Notification marked as read.', updated);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/users/me/notifications/read-all
// Mark ALL of the current user's notifications as read.
// ─────────────────────────────────────────────────────────────
const markAllAsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });

    return successResponse(res, 'All notifications marked as read.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
