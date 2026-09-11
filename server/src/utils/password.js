const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

/**
 * Hash a plain-text password.
 * bcrypt.hash() generates a random salt and embeds it in the hash string,
 * so we never need to store a separate salt column.
 *
 * SALT_ROUNDS = 12 means 2^12 = 4096 hash iterations.
 * That takes ~300ms on modern hardware — fast enough for users,
 * expensive enough to slow down brute-force attacks.
 *
 * @param {string} plainPassword
 * @returns {Promise<string>} bcrypt hash (60 characters)
 */
const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

/**
 * Compare a plain-text password against a stored bcrypt hash.
 * Returns true if they match, false otherwise.
 * Never compare passwords with === — always use bcrypt.compare.
 *
 * @param {string} plainPassword
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
const comparePassword = async (plainPassword, hash) => {
  return bcrypt.compare(plainPassword, hash);
};

module.exports = { hashPassword, comparePassword };
