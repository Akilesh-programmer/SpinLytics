/**
 * Global error handler middleware
 * Catches all errors and returns consistent JSON responses
 */
const config = require('../config');
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, _next) => {
  let error = err;

  // If not an ApiError, wrap it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], err.stack);
  }

  const response = {
    success: false,
    message: error.message,
    ...(error.errors && error.errors.length > 0 && { errors: error.errors }),
    ...(config.isDev && { stack: error.stack }),
  };

  // Log error in development
  if (config.isDev) {
    console.error(`[ERROR] ${error.statusCode} - ${error.message}`);
    if (error.stack) console.error(error.stack);
  }

  res.status(error.statusCode).json(response);
};

module.exports = errorHandler;
