const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// ─────────────────────────────────────────────────────────────
// GET /api/projects/:id/activities
// Chronological audit stream — the project timeline.
// ─────────────────────────────────────────────────────────────
const getActivities = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: { projectId: req.params.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      prisma.activity.count({ where: { projectId: req.params.id } }),
    ]);

    return successResponse(res, 'Activities retrieved.', { activities, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    next(error);
  }
};

/**
 * Internal helper used by other controllers to log project activity.
 * Supports:
 *   logActivity({ projectId, userId, action, details })
 *   logActivity(tx, projectId, userId, action, details)
 */
const logActivity = async (clientOrOpts, projectId, userId, action, details) => {
  try {
    let client = prisma;
    let data = {};

    if (clientOrOpts && typeof clientOrOpts === 'object' && clientOrOpts.projectId) {
      data = {
        projectId: clientOrOpts.projectId,
        userId: clientOrOpts.userId,
        action: clientOrOpts.action,
        details: clientOrOpts.details,
      };
      if (clientOrOpts.client) client = clientOrOpts.client;
    } else if (clientOrOpts && clientOrOpts.activity) {
      client = clientOrOpts;
      data = { projectId, userId, action, details };
    } else {
      data = {
        projectId: clientOrOpts,
        userId: projectId,
        action: userId,
        details: action,
      };
    }

    return await client.activity.create({ data });
  } catch (err) {
    console.error('[ActivityLog] Failed to log activity:', err.message);
    return null;
  }
};

module.exports = { getActivities, logActivity };
