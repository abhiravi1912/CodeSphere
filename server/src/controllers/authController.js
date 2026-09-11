const prisma = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Build a safe user object to send to the client.
 * NEVER include passwordHash in any API response.
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
});

// ─────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Input validation — keep it simple; full Zod/Joi validation is Phase 4+
    if (!name || !email || !password) {
      return errorResponse(res, 'Name, email, and password are required.', 400);
    }

    if (password.length < 8) {
      return errorResponse(res, 'Password must be at least 8 characters long.', 400);
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, 'Please provide a valid email address.', 400);
    }

    // 2. Check for duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return errorResponse(res, 'An account with this email already exists.', 409);
    }

    // 3. Hash the password — NEVER store plain text
    const passwordHash = await hashPassword(password);

    // 4. Create user record in PostgreSQL
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
      },
    });

    // 5. Generate JWT token for immediate login after registration
    const token = generateToken({ id: newUser.id, email: newUser.email });

    return successResponse(
      res,
      'Account created successfully. Welcome to CodeSphere!',
      { token, user: sanitizeUser(newUser) },
      201
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Email and password are required.', 400);
    }

    // 1. Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // 2. Use a deliberately vague error message to prevent user enumeration
    //    (An attacker should not be able to tell whether the email exists or the password is wrong.)
    if (!user) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    // 3. Compare plain password against stored bcrypt hash
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    // 4. Issue JWT
    const token = generateToken({ id: user.id, email: user.email });

    return successResponse(res, 'Login successful. Welcome back!', {
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login };
