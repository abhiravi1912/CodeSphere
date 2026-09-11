const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const prisma = require('./config/database');
const { verifyToken } = require('./utils/jwt');

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
});

// ─────────────────────────────────────────────────────────────
// Socket.IO Authentication Middleware
// Every socket connection must carry a valid JWT.
// ─────────────────────────────────────────────────────────────
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided.'));
    }

    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, avatarUrl: true },
    });

    if (!user) {
      return next(new Error('Authentication error: User not found.'));
    }

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token.'));
  }
});

// ─────────────────────────────────────────────────────────────
// Socket.IO Connection Handler
// ─────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Connected: ${socket.user.name} (${socket.id})`);

  // ─── join_project ──────────────────────────────────────────
  // Client emits this when entering a project workspace.
  // We verify membership before allowing them into the room.
  socket.on('join_project', async ({ projectId }) => {
    try {
      if (!projectId) return;

      // Verify the socket user is actually a member
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: socket.user.id } },
      });

      if (!membership) {
        socket.emit('error', { message: 'You are not a member of this project.' });
        return;
      }

      const room = `project:${projectId}`;
      socket.join(room);
      console.log(`[Socket.IO] ${socket.user.name} joined room ${room}`);

      // Notify other members this user is online
      socket.to(room).emit('user_online', { user: socket.user });
    } catch (err) {
      console.error('[Socket.IO] join_project error:', err);
    }
  });

  // ─── leave_project ─────────────────────────────────────────
  socket.on('leave_project', ({ projectId }) => {
    const room = `project:${projectId}`;
    socket.leave(room);
    socket.to(room).emit('user_offline', { user: socket.user });
    console.log(`[Socket.IO] ${socket.user.name} left room ${room}`);
  });

  // ─── send_message ──────────────────────────────────────────
  // Client emits this to send a chat message.
  // We persist to PostgreSQL then broadcast to the project room.
  socket.on('send_message', async ({ projectId, content }) => {
    try {
      if (!projectId || !content?.trim()) return;

      // Verify membership before allowing message
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: socket.user.id } },
      });

      if (!membership) {
        socket.emit('error', { message: 'Not authorized to send messages here.' });
        return;
      }

      // Persist to PostgreSQL
      const message = await prisma.message.create({
        data: {
          projectId,
          senderId: socket.user.id,
          content: content.trim(),
        },
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

      // Broadcast to everyone in the room (including sender)
      io.to(`project:${projectId}`).emit('receive_message', { message });
    } catch (err) {
      console.error('[Socket.IO] send_message error:', err);
      socket.emit('error', { message: 'Failed to send message.' });
    }
  });

  // ─── typing_start / typing_stop ────────────────────────────
  socket.on('typing_start', ({ projectId }) => {
    socket.to(`project:${projectId}`).emit('typing_start', { user: socket.user });
  });

  socket.on('typing_stop', ({ projectId }) => {
    socket.to(`project:${projectId}`).emit('typing_stop', { user: socket.user });
  });

  // ─── disconnect ────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    console.log(`[Socket.IO] Disconnected: ${socket.user.name} (${reason})`);
    // Broadcast offline to all rooms this socket was in
    socket.rooms.forEach((room) => {
      if (room.startsWith('project:')) {
        socket.to(room).emit('user_offline', { user: socket.user });
      }
    });
  });
});

// Attach Socket.IO instance to app for controller access
app.set('io', io);

// Start HTTP Server
server.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 CodeSphere Server running in [${process.env.NODE_ENV || 'development'}] mode`);
  console.log(`📡 HTTP Server listening on http://localhost:${PORT}`);
  console.log(`⚡ Socket.IO listening on port ${PORT}`);
  console.log(`🏥 Health Check available at http://localhost:${PORT}/api/health`);
  console.log('====================================================');
});

// Graceful Shutdown handling
const handleGracefulShutdown = async (signal) => {
  console.log(`\n[${signal}] Received. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('HTTP & Socket.IO servers closed.');
    try {
      await prisma.$disconnect();
      console.log('Prisma Database connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error during database disconnect:', err);
      process.exit(1);
    }
  });
};

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

module.exports = { server, io };
