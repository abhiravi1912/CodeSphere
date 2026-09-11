const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// ─────────────────────────────────────────────────────────────
// HELPER — Emit a Socket.IO event to everyone in a project room
// ─────────────────────────────────────────────────────────────
const emitToProject = (req, projectId, event, data) => {
  const io = req.app.get('io');
  if (io) io.to(`project:${projectId}`).emit(event, data);
};

// ─────────────────────────────────────────────────────────────
// GET /api/projects/:id/tasks
// List all tasks for a project, ordered by creation date.
// ─────────────────────────────────────────────────────────────
const getTasks = async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { projectId: req.params.id },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return successResponse(res, 'Tasks retrieved successfully.', tasks);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/projects/:id/tasks
// Create a new task. Any project member can create a task.
// Body: { title, description?, priority?, dueDate?, assigneeId? }
// ─────────────────────────────────────────────────────────────
const createTask = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { title, description, priority = 'MEDIUM', dueDate, assigneeId } = req.body;

    if (!title || title.trim().length === 0) {
      return errorResponse(res, 'Task title is required.', 400);
    }

    // If an assignee is given, verify they are a project member
    if (assigneeId) {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: assigneeId } },
      });
      if (!membership) {
        return errorResponse(res, 'Assignee must be a member of this project.', 400);
      }
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        title: title.trim(),
        description: description?.trim() || null,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        creatorId: req.user.id,
        assigneeId: assigneeId || null,
        status: 'TODO',
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Activity log
    await prisma.activity.create({
      data: {
        projectId,
        userId: req.user.id,
        action: 'TASK_CREATED',
        details: `${req.user.name} created task: "${task.title}".`,
      },
    });

    // Notify assignee if different from creator
    if (assigneeId && assigneeId !== req.user.id) {
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          title: 'New Task Assigned',
          message: `You have been assigned to task: "${task.title}".`,
          linkUrl: `/projects/${projectId}`,
        },
      });
    }

    // Real-time broadcast
    emitToProject(req, projectId, 'task_created', { task });

    return successResponse(res, 'Task created successfully.', task, 201);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/tasks/:taskId
// Update a task — status, priority, assignee, title, description, dueDate.
// Creator or project OWNER/ADMIN can update. Any member can change status.
// ─────────────────────────────────────────────────────────────
const updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    // Fetch the task to confirm it exists and get its projectId
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) return errorResponse(res, 'Task not found.', 404);

    const projectId = existing.projectId;

    // Confirm caller is a member of the project
    const callerMembership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });
    if (!callerMembership) {
      return errorResponse(res, 'You are not a member of this project.', 403);
    }

    // Build update payload
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (status !== undefined) updateData.status = status;

    if (assigneeId !== undefined) {
      if (assigneeId !== null) {
        const membership = await prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId, userId: assigneeId } },
        });
        if (!membership) {
          return errorResponse(res, 'Assignee must be a member of this project.', 400);
        }
      }
      updateData.assigneeId = assigneeId;
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse(res, 'No update fields provided.', 400);
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Activity log — only record meaningful status transitions
    if (status) {
      await prisma.activity.create({
        data: {
          projectId,
          userId: req.user.id,
          action: status === 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_UPDATED',
          details: `${req.user.name} moved task "${updatedTask.title}" to ${status.replace('_', ' ')}.`,
        },
      });
    }

    emitToProject(req, projectId, 'task_updated', { task: updatedTask });

    return successResponse(res, 'Task updated successfully.', updatedTask);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/tasks/:taskId
// Delete a task. Creator, OWNER, or ADMIN can delete.
// ─────────────────────────────────────────────────────────────
const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) return errorResponse(res, 'Task not found.', 404);

    const projectId = existing.projectId;

    // Confirm caller is a member
    const callerMembership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });
    if (!callerMembership) {
      return errorResponse(res, 'You are not a member of this project.', 403);
    }

    // Only the task creator, OWNER, or ADMIN can delete
    const canDelete =
      existing.creatorId === req.user.id ||
      callerMembership.role === 'OWNER' ||
      callerMembership.role === 'ADMIN';

    if (!canDelete) {
      return errorResponse(res, 'Only the task creator, OWNER, or ADMIN can delete tasks.', 403);
    }

    await prisma.task.delete({ where: { id: taskId } });

    await prisma.activity.create({
      data: {
        projectId,
        userId: req.user.id,
        action: 'TASK_DELETED',
        details: `${req.user.name} deleted task: "${existing.title}".`,
      },
    });

    emitToProject(req, projectId, 'task_deleted', { taskId });

    return successResponse(res, 'Task deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
