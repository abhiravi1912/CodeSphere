const prisma = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Build a safe user object — strips passwordHash from any response.
 */
const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl,
  bio: user.bio,
  skills: user.skills,
  githubUrl: user.githubUrl,
  linkedinUrl: user.linkedinUrl,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// ─────────────────────────────────────────────
// GET /api/users/me
// Returns the current authenticated user's profile.
// ─────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    // req.user is already attached by protect() middleware.
    // We re-fetch to ensure we always return fresh data.
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }

    return successResponse(res, 'Profile retrieved successfully.', sanitizeUser(user));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// PUT /api/users/me
// Update profile fields (name, bio, skills, socials, avatarUrl).
// Password changes are handled separately by changePassword().
// ─────────────────────────────────────────────
const updateMe = async (req, res, next) => {
  try {
    const { name, bio, skills, githubUrl, linkedinUrl, avatarUrl } = req.body;

    // Build update payload — only include fields that were actually provided
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (bio !== undefined) updateData.bio = bio;
    if (skills !== undefined) updateData.skills = Array.isArray(skills) ? skills : [];
    if (githubUrl !== undefined) updateData.githubUrl = githubUrl;
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    if (Object.keys(updateData).length === 0) {
      return errorResponse(res, 'No update fields provided.', 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });

    return successResponse(res, 'Profile updated successfully.', sanitizeUser(updatedUser));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// PUT /api/users/me/password
// Change password — requires current password verification before update.
// ─────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required.', 400);
    }

    if (newPassword.length < 8) {
      return errorResponse(res, 'New password must be at least 8 characters long.', 400);
    }

    // Fetch user WITH passwordHash (not included in req.user from protect middleware)
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    // Verify the current password
    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return errorResponse(res, 'Current password is incorrect.', 401);
    }

    // Hash the new password and update
    const newPasswordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newPasswordHash },
    });

    return successResponse(res, 'Password changed successfully.');
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// GET /api/users/:id
// View another developer's public profile.
// ─────────────────────────────────────────────
const getUserById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        bio: true,
        skills: true,
        githubUrl: true,
        linkedinUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }

    return successResponse(res, 'User profile retrieved.', user);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// GET /api/users/search?q=<query>
// Search users by name or email (used when inviting members to projects).
// ─────────────────────────────────────────────
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return errorResponse(res, 'Search query must be at least 2 characters.', 400);
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q.trim(), mode: 'insensitive' } },
          { email: { contains: q.trim(), mode: 'insensitive' } },
        ],
        // Exclude current user from search results
        NOT: { id: req.user.id },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        skills: true,
      },
      take: 10,
    });

    return successResponse(res, 'Search results retrieved.', users);
  } catch (error) {
    next(error);
  }
};

module.exports = { getMe, updateMe, changePassword, getUserById, searchUsers };
