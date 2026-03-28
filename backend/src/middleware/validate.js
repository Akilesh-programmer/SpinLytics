/**
 * Validation middleware factory using Zod schemas
 * Validates request body, query, and params
 */
const ApiError = require('../utils/ApiError');

/**
 * Creates a validation middleware for the given Zod schema
 * @param {Object} schemas - { body?: ZodSchema, query?: ZodSchema, params?: ZodSchema }
 */
const validate = (schemas) => (req, _res, next) => {
  const errors = [];

  if (schemas.body) {
    const result = schemas.body.safeParse(req.body);
    if (!result.success) {
      errors.push(
        ...result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          source: 'body',
        }))
      );
    } else {
      req.body = result.data; // Use parsed (transformed) data
    }
  }

  if (schemas.query) {
    const result = schemas.query.safeParse(req.query);
    if (!result.success) {
      errors.push(
        ...result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          source: 'query',
        }))
      );
    } else {
      req.query = result.data;
    }
  }

  if (schemas.params) {
    const result = schemas.params.safeParse(req.params);
    if (!result.success) {
      errors.push(
        ...result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          source: 'params',
        }))
      );
    } else {
      req.params = result.data;
    }
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Validation failed', errors));
  }

  next();
};

module.exports = validate;
