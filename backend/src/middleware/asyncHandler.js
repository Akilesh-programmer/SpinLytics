/**
 * Async handler wrapper — eliminates try/catch in every controller
 * Catches async errors and passes them to Express error handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
