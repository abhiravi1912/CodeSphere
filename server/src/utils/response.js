/**
 * Standardized API Response Helpers
 */

/**
 * Send a success JSON response
 * Supports both:
 *   successResponse(res, 'Project found', project, 200)
 *   successResponse(res, { project }, 200)
 */
const successResponse = (res, message = 'Success', data = null, statusCode = 200) => {
  let msg = message;
  let payload = data;
  let code = statusCode;

  if (typeof message === 'object' && message !== null) {
    payload = message;
    msg = 'Success';
    if (typeof data === 'number') {
      code = data;
    }
  }

  const response = {
    success: true,
    message: msg,
  };
  if (payload !== null) {
    response.data = payload;
  }
  return res.status(code).json(response);
};

/**
 * Send an error JSON response
 */
const errorResponse = (res, message = 'Error', statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message: typeof message === 'string' ? message : 'Error occurred',
  };
  if (errors !== null) {
    response.errors = errors;
  }
  return res.status(typeof statusCode === 'number' ? statusCode : 400).json(response);
};

/**
 * Send a paginated list response
 */
const paginatedResponse = (res, message = 'Success', data = [], page = 1, limit = 20, total = 0) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
};
