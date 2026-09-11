const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start safely.');
}

/**
 * Generate a signed JWT access token for a given user payload.
 *
 * The token payload contains:
 *   - id       : UUID of the user (used to look up in DB)
 *   - email    : Included for quick reference (do NOT include password or secrets)
 *
 * The token is signed with the JWT_SECRET using HS256 algorithm by default.
 * It expires after JWT_EXPIRES_IN (default: 7 days).
 *
 * SECURITY: The secret must be a long, random string stored ONLY in .env
 *
 * @param {Object} payload  - { id, email }
 * @returns {string}        - Signed JWT string
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify and decode a JWT token string.
 * Throws JsonWebTokenError if the token is tampered or invalid.
 * Throws TokenExpiredError if the token has expired.
 *
 * @param {string} token
 * @returns {Object} Decoded payload { id, email, iat, exp }
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
