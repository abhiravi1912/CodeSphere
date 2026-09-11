const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

const emitToProject = (req, projectId, event, data) => {
  const io = req.app.get('io');
  if (io) io.to(`project:${projectId}`).emit(event, data);
};

// ─────────────────────────────────────────────────────────────
// GET /api/projects/:id/members
// List all members and their roles for a project.
// ─────────────────────────────────────────────────────────────
const getMembers = async (req, res, next) => {
  try {
    const members = await prisma.projectMember.findMany({
      where: { projectId: req.params.id },
      include: {
        user: {
          select: {
            id: true, name: true, email: true,
            avatarUrl: true, bio: true, skills: true,
            githubUrl: true, linkedinUrl: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return successResponse(res, 'Members retrieved successfully.', members);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/projects/:id/members
// Add a user to a project. OWNER or ADMIN only.
// Body: { userId, role? }  (role defaults to MEMBER)
// ─────────────────────────────────────────────────────────────
const addMember = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { userId, role = 'MEMBER' } = req.body;

    if (!userId) {
      return errorResponse(res, 'userId is required.', 400);
    }

    // Only OWNER can assign ADMIN role during invitation
    if (role === 'OWNER') {
      return errorResponse(res, 'Cannot assign OWNER role through invitation.', 400);
    }
    if (role === 'ADMIN' && req.projectMember.role !== 'OWNER') {
      return errorResponse(res, 'Only the project OWNER can add ADMINs.', 403);
    }

    // Check the target user actually exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });
    if (!targetUser) {
      return errorResponse(res, 'User not found.', 404);
    }

    // Prevent duplicate membership
    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (existing) {
      return errorResponse(res, 'This user is already a member of the project.', 409);
    }

    const membership = await prisma.projectMember.create({
      data: { projectId, userId, role },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    });

    // Activity log
    await prisma.activity.create({
      data: {
        projectId,
        userId: req.user.id,
        action: 'MEMBER_ADDED',
        details: `${req.user.name} added ${targetUser.name} to the project as ${role}.`,
      },
    });

    // In-app notification to the invited user
    await prisma.notification.create({
      data: {
        userId,
        title: 'Project Invitation',
        message: `You have been added to the project as ${role}.`,
        linkUrl: `/projects/${projectId}`,
      },
    });

    // Real-time broadcast to existing project members
    emitToProject(req, projectId, 'member_added', { member: membership });

    return successResponse(res, `${targetUser.name} added to the project.`, membership, 201);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/projects/:id/members/:userId
// Change a member's role. OWNER only.
// Body: { role }  — must be ADMIN or MEMBER (can't reassign OWNER this way)
// ─────────────────────────────────────────────────────────────
const updateMemberRole = async (req, res, next) => {
  try {
    const { id: projectId, userId } = req.params;
    const { role } = req.body;

    if (!role || !['ADMIN', 'MEMBER'].includes(role)) {
      return errorResponse(res, 'Role must be either ADMIN or MEMBER.', 400);
    }

    // Prevent changing your own role
    if (userId === req.user.id) {
      return errorResponse(res, 'You cannot change your own role.', 400);
    }

    // Prevent demoting another OWNER
    const target = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!target) return errorResponse(res, 'Member not found in this project.', 404);
    if (target.role === 'OWNER') {
      return errorResponse(res, 'Cannot change the role of the project OWNER.', 403);
    }

    const updated = await prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    });

    await prisma.activity.create({
      data: {
        projectId,
        userId: req.user.id,
        action: 'MEMBER_ROLE_CHANGED',
        details: `${req.user.name} changed ${updated.user.name}'s role to ${role}.`,
      },
    });

    emitToProject(req, projectId, 'member_role_changed', { member: updated });

    return successResponse(res, `Role updated to ${role}.`, updated);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/projects/:id/members/:userId
// Remove a member OR leave the project (if userId === req.user.id).
// OWNER can remove anyone except themselves.
// ADMIN can remove MEMBERs only.
// Any member can leave themselves.
// ─────────────────────────────────────────────────────────────
const removeMember = async (req, res, next) => {
  try {
    const { id: projectId, userId } = req.params;
    const isSelf = userId === req.user.id;
    const callerRole = req.projectMember.role;

    // Fetch the target membership
    const target = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      include: { user: { select: { name: true } } },
    });
    if (!target) return errorResponse(res, 'Member not found in this project.', 404);

    // OWNER cannot leave — they must delete the project instead
    if (isSelf && callerRole === 'OWNER') {
      return errorResponse(res, 'The project OWNER cannot leave. Transfer ownership or delete the project.', 400);
    }
    // Nobody can remove an OWNER
    if (!isSelf && target.role === 'OWNER') {
      return errorResponse(res, 'The project OWNER cannot be removed.', 403);
    }
    // ADMIN can only remove MEMBERs, not other ADMINs
    if (!isSelf && callerRole === 'ADMIN' && target.role === 'ADMIN') {
      return errorResponse(res, 'ADMINs cannot remove other ADMINs.', 403);
    }
    // MEMBER cannot remove others
    if (!isSelf && callerRole === 'MEMBER') {
      return errorResponse(res, 'Members can only remove themselves.', 403);
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });

    const actionDetails = isSelf
      ? `${req.user.name} left the project.`
      : `${req.user.name} removed ${target.user.name} from the project.`;

    await prisma.activity.create({
      data: {
        projectId,
        userId: req.user.id,
        action: isSelf ? 'MEMBER_LEFT' : 'MEMBER_REMOVED',
        details: actionDetails,
      },
    });

    emitToProject(req, projectId, 'member_removed', { userId });

    return successResponse(res, isSelf ? 'You have left the project.' : `${target.user.name} removed from project.`);
  } catch (error) {
    next(error);
  }
};

module.exports = { getMembers, addMember, updateMemberRole, removeMember };
