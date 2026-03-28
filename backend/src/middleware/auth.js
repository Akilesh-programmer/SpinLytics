/**
 * Placeholder auth middleware
 * To be implemented when authentication is needed
 * Currently allows all requests through
 */
const auth = (req, _res, next) => {
  // TODO: Implement JWT authentication
  // For now, allow all requests
  next();
};

module.exports = auth;
