const express = require('express');
const router = express.Router();
const controller = require('../controllers/production.controller');
const validate = require('../middleware/validate');
const {
  createProductionSchema,
  updateProductionSchema,
  productionQuerySchema,
  idParamSchema,
  dateParamSchema,
} = require('../validators/production.validator');

// POST /api/v1/production — Create production entry
router.post(
  '/',
  validate({ body: createProductionSchema }),
  controller.create
);

// GET /api/v1/production — List entries with filters
router.get(
  '/',
  validate({ query: productionQuerySchema }),
  controller.getAll
);

// GET /api/v1/production/daily/:date — Get both frames for a date
router.get(
  '/daily/:date',
  validate({ params: dateParamSchema }),
  controller.getByDate
);

// GET /api/v1/production/:id — Get single entry
router.get(
  '/:id',
  validate({ params: idParamSchema }),
  controller.getById
);

// PUT /api/v1/production/:id — Update entry
router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateProductionSchema }),
  controller.update
);

// DELETE /api/v1/production/:id — Delete entry
router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  controller.remove
);

module.exports = router;
