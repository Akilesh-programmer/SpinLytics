const express = require('express');
const router = express.Router();
const controller = require('../controllers/shift-production.controller');
const validate = require('../middleware/validate');
const {
  shiftProductionRowSchema,
  createShiftProductionBatchSchema,
  updateShiftProductionSchema,
  shiftProductionQuerySchema,
  idParamSchema,
  dateParamSchema,
} = require('../validators/shift-production.validator');

// POST /api/v1/shift-production — Create single entry (auto-save)
router.post(
  '/',
  validate({ body: shiftProductionRowSchema }),
  controller.createSingle
);

// POST /api/v1/shift-production/batch — Create batch (Save All)
router.post(
  '/batch',
  validate({ body: createShiftProductionBatchSchema }),
  controller.createBatch
);

// GET /api/v1/shift-production — List entries with filters
router.get(
  '/',
  validate({ query: shiftProductionQuerySchema }),
  controller.getAll
);

// GET /api/v1/shift-production/daily/:date — Get all entries for a date
router.get(
  '/daily/:date',
  validate({ params: dateParamSchema }),
  controller.getByDate
);

// GET /api/v1/shift-production/:id — Get single entry
router.get(
  '/:id',
  validate({ params: idParamSchema }),
  controller.getById
);

// PUT /api/v1/shift-production/:id — Update entry
router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateShiftProductionSchema }),
  controller.update
);

// DELETE /api/v1/shift-production/:id — Delete entry
router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  controller.remove
);

module.exports = router;
