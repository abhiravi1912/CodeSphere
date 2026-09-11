const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// ─────────────────────────────────────────────────────────────
// GET /api/projects/:id/messages
// Fetch paginated message history for a project chat room.
// Used on tab open so users can see previous messages.
// ─────────────────────────────────────────────────────────────
const getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { projectId: req.params.id },
        orderBy: { createdAt: 'asc' },
        skip,
        take: Number(limit),
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      prisma.message.count({ where: { projectId: req.params.id } }),
    ]);

    return successResponse(res, 'Messages retrieved.', { messages, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/projects/:id/messages
// Save a message via REST (fallback / initial send).
// The primary path is Socket.IO — but this keeps REST parity.
// ─────────────────────────────────────────────────────────────
const createMessage = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return errorResponse(res, 'Message content cannot be empty.', 400);
    }

    const message = await prisma.message.create({
      data: {
        projectId,
        senderId: req.user.id,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Broadcast to Socket.IO room
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${projectId}`).emit('receive_message', { message });
    }

    return successResponse(res, 'Message sent.', message, 201);
  } catch (error) {
    next(error);
  }
};

module.exports = { getMessages, createMessage };
