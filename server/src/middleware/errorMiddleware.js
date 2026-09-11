// Catch 404 errors for unknown routes
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Resource Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global Centralized Error Handler
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Handle specific Prisma database errors
  if (err.code === 'P2002') {
    // Unique constraint violation
    statusCode = 409;
    const targetField = err.meta?.target ? err.meta.target.join(', ') : 'field';
    message = `A record with this ${targetField} already exists.`;
  } else if (err.code === 'P2025') {
    // Record not found in database operation
    statusCode = 404;
    message = 'Requested record not found in database.';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
