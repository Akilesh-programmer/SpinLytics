const express = require('express');
const router = express.Router();
const controller = require('../controllers/stock.controller');
const validate = require('../middleware/validate');
const {
  createStockTransactionSchema,
  updateStockTransactionSchema,
  stockQuerySchema,
  materialParamSchema,
  idParamSchema,
  dateParamSchema,
} = require('../validators/stock.validator');

// POST /api/v1/stock/transactions — Create stock transaction
router.post(
  '/transactions',
  validate({ body: createStockTransactionSchema }),
  controller.create
);

// GET /api/v1/stock/transactions — List with filters
router.get(
  '/transactions',
  validate({ query: stockQuerySchema }),
  controller.getAll
);

// GET /api/v1/stock/current — Current stock per material
router.get('/current', controller.getCurrentStock);

// GET /api/v1/stock/current/:materialType — Stock for specific material
router.get(
  '/current/:materialType',
  validate({ params: materialParamSchema }),
  controller.getCurrentStockByMaterial
);

// GET /api/v1/stock/lot-wise — Stock grouped by lot
router.get('/lot-wise', controller.getLotWiseStock);

// GET /api/v1/stock/party-wise — Stock grouped by party
router.get('/party-wise', controller.getPartyWiseStock);

// GET /api/v1/stock/opening/:date — Opening stock for date
router.get(
  '/opening/:date',
  validate({ params: dateParamSchema }),
  controller.getOpeningStock
);

// GET /api/v1/stock/closing/:date — Closing stock for date
router.get(
  '/closing/:date',
  validate({ params: dateParamSchema }),
  controller.getClosingStock
);

// GET /api/v1/stock/transactions/:id — Single transaction
router.get(
  '/transactions/:id',
  validate({ params: idParamSchema }),
  controller.getById
);

// PUT /api/v1/stock/transactions/:id — Update transaction
router.put(
  '/transactions/:id',
  validate({ params: idParamSchema, body: updateStockTransactionSchema }),
  controller.update
);

// DELETE /api/v1/stock/transactions/:id — Delete transaction
router.delete(
  '/transactions/:id',
  validate({ params: idParamSchema }),
  controller.remove
);

module.exports = router;
