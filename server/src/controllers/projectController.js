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
// POST /api/projects
// Create a new project. The creator automatically becomes OWNER.
// ─────────────────────────────────────────────────────────────
const createProject = async (req, res, next) => {
  try {
    const { name, description, category, techStack, deadline, githubRepoUrl } = req.body;

    if (!name || name.trim().length === 0) {
      return errorResponse(res, 'Project name is required.', 400);
    }

    // Use a Prisma transaction so both the Project and the
    // ProjectMember (OWNER) records are created atomically.
    // If either insert fails, both are rolled back.
    const { project, membership } = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          category: category?.trim() || null,
          techStack: Array.isArray(techStack) ? techStack : [],
          deadline: deadline ? new Date(deadline) : null,
          githubRepoUrl: githubRepoUrl?.trim() || null,
          ownerId: req.user.id,
        },
      });

      const membership = await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId: req.user.id,
          role: 'OWNER',
        },
      });

      // Log this as the first activity on the project timeline
      await tx.activity.create({
        data: {
          projectId: project.id,
          userId: req.user.id,
          action: 'PROJECT_CREATED',
          details: `${req.user.name} created the project.`,
        },
      });

      return { project, membership };
    });

    return successResponse(res, 'Project created successfully.', { project, role: membership.role }, 201);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/projects
// List all projects the current user is a member of.
// ─────────────────────────────────────────────────────────────
const getMyProjects = async (req, res, next) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      include: {
        project: {
          include: {
            _count: {
              select: { members: true, tasks: true, files: true, messages: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const projects = memberships.map((m) => ({
      ...m.project,
      myRole: m.role,
    }));

    return successResponse(res, 'Projects retrieved successfully.', projects);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/projects/:id
// Get full details for one project. Requires membership.
// ─────────────────────────────────────────────────────────────
const getProjectById = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true, skills: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: {
          select: { tasks: true, files: true, messages: true },
        },
      },
    });

    if (!project) {
      return errorResponse(res, 'Project not found.', 404);
    }

    // Attach the current user's role in this project
    const myMembership = project.members.find((m) => m.userId === req.user.id);

    return successResponse(res, 'Project retrieved successfully.', {
      ...project,
      myRole: myMembership?.role || null,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/projects/:id
// Update project metadata. OWNER or ADMIN only.
// ─────────────────────────────────────────────────────────────
const updateProject = async (req, res, next) => {
  try {
    const { name, description, category, techStack, deadline, githubRepoUrl, status } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (techStack !== undefined) updateData.techStack = Array.isArray(techStack) ? techStack : [];
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
    if (githubRepoUrl !== undefined) updateData.githubRepoUrl = githubRepoUrl;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return errorResponse(res, 'No update fields provided.', 400);
    }

    const updatedProject = await prisma.project.update({
      where: { id: req.params.id },
      data: updateData,
    });

    // Log activity
    await prisma.activity.create({
      data: {
        projectId: req.params.id,
        userId: req.user.id,
        action: 'PROJECT_UPDATED',
        details: `${req.user.name} updated project details.`,
      },
    });

    emitToProject(req, req.params.id, 'project_updated', { project: updatedProject });

    return successResponse(res, 'Project updated successfully.', updatedProject);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/projects/:id
// Permanently delete a project. OWNER only.
// Cascade deletes all tasks, messages, files, activities.
// ─────────────────────────────────────────────────────────────
const deleteProject = async (req, res, next) => {
  try {
    await prisma.project.delete({
      where: { id: req.params.id },
    });

    return successResponse(res, 'Project deleted successfully.');
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/projects/:id/health
// Compute the project health metrics shown on the dashboard.
// ─────────────────────────────────────────────────────────────
const getProjectHealth = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    // Fetch all metrics in parallel for maximum efficiency
    const [project, taskStats, memberCount, fileStats, messageCount, recentActivities, githubIntegration] =
      await Promise.all([
        prisma.project.findUnique({ where: { id: projectId } }),
        prisma.task.groupBy({
          by: ['status'],
          where: { projectId },
          _count: { status: true },
        }),
        prisma.projectMember.count({ where: { projectId } }),
        prisma.file.aggregate({
          where: { projectId },
          _count: { id: true },
          _sum: { fileSize: true },
        }),
        prisma.message.count({ where: { projectId } }),
        prisma.activity.findMany({
          where: { projectId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { user: { select: { name: true, avatarUrl: true } } },
        }),
        prisma.gitHubIntegration.findUnique({ where: { projectId } }),
      ]);

    if (!project) return errorResponse(res, 'Project not found.', 404);

    // Compute task breakdown from groupBy result
    const taskBreakdown = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, COMPLETED: 0 };
    taskStats.forEach((s) => { taskBreakdown[s.status] = s._count.status; });
    const totalTasks = Object.values(taskBreakdown).reduce((a, b) => a + b, 0);
    const completedTasks = taskBreakdown.COMPLETED;
    const completionPercent =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Days remaining to deadline
    let daysRemaining = null;
    if (project.deadline) {
      const diffMs = new Date(project.deadline) - new Date();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    const health = {
      projectId,
      name: project.name,
      status: project.status,
      deadline: project.deadline,
      daysRemaining,
      completionPercent,
      members: memberCount,
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        remaining: totalTasks - completedTasks,
        breakdown: taskBreakdown,
      },
      files: {
        count: fileStats._count.id,
        totalSizeBytes: fileStats._sum.fileSize || 0,
      },
      messages: messageCount,
      recentActivities,
      github: {
        connected: !!githubIntegration,
        repoOwner: githubIntegration?.repoOwner || null,
        repoName: githubIntegration?.repoName || null,
        repoUrl: githubIntegration?.repoUrl || null,
        defaultBranch: githubIntegration?.defaultBranch || null,
      },
    };

    return successResponse(res, 'Project health retrieved.', health);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectHealth,
};
