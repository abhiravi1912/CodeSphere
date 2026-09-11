const { verifyToken } = require('../utils/jwt');
const prisma = require('../config/database');

/**
 * AUTHENTICATION MIDDLEWARE — protect()
 *
 * This middleware runs BEFORE any protected route handler.
 * It does three things:
 *   1. Extracts the JWT from the "Authorization: Bearer <token>" header.
 *   2. Verifies the token using the JWT_SECRET (rejects expired/tampered tokens).
 *   3. Loads the live user record from PostgreSQL and attaches it to req.user.
 *
 * Why do we re-query the database (step 3) instead of just trusting the token payload?
 *   Because if a user's account is deleted, or if we later add account suspension,
 *   we need to catch that. A valid token for a deleted user should still be rejected.
 *
 * Usage: add `protect` as the second argument in any route that needs authentication.
 *   router.get('/me', protect, userController.getMe);
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Check that Authorization header exists and is "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify the token — throws JsonWebTokenError or TokenExpiredError on failure
    const decoded = verifyToken(token);

    // 3. Fetch the current user from PostgreSQL
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
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
      return res.status(401).json({
        success: false,
        message: 'The user for this token no longer exists.',
      });
    }

    // 4. Attach user to request object for downstream controllers
    req.user = user;
    next();
  } catch (error) {
    // JWT errors are caught and formatted here
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token. Please log in again.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    next(error);
  }
};

/**
 * PROJECT ROLE AUTHORIZATION MIDDLEWARE — requireRole(...roles)
 *
 * This middleware runs AFTER protect() and AFTER a project membership lookup.
 * It verifies that req.projectMember.role is in the allowed roles list.
 *
 * Usage:
 *   router.delete('/:id', protect, loadProjectMember, requireRole('OWNER'), ...)
 *
 * @param {...string} roles - Allowed role strings: 'OWNER', 'ADMIN', 'MEMBER'
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.projectMember) {
      return res.status(403).json({
        success: false,
        message: 'Role check failed: project membership not loaded.',
      });
    }

    if (!roles.includes(req.projectMember.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden. This action requires one of: [${roles.join(', ')}].`,
      });
    }

    next();
  };
};

/**
 * PROJECT MEMBERSHIP LOADER MIDDLEWARE — loadProjectMember()
 *
 * Fetches the current user's ProjectMember record for the given :id (projectId).
 * Attaches it to req.projectMember so requireRole() and controllers can read it.
 *
 * Must run AFTER protect() (needs req.user).
 *
 * Usage:
 *   router.get('/:id/tasks', protect, loadProjectMember, requireRole('MEMBER', 'ADMIN', 'OWNER'), ...)
 */
const loadProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this project.',
      });
    }

    req.projectMember = membership;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { protect, requireRole, loadProjectMember };
