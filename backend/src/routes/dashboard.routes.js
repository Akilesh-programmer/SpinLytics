const express = require('express');
const router = express.Router();
const controller = require('../controllers/dashboard.controller');

// GET /api/v1/dashboard/daily/:date
router.get('/daily/:date', controller.getDailySummary);

// GET /api/v1/dashboard/monthly/:year/:month
router.get('/monthly/:year/:month', controller.getMonthlySummary);

// GET /api/v1/dashboard/yearly/:year
router.get('/yearly/:year', controller.getYearlySummary);

// GET /api/v1/dashboard/stock
router.get('/stock', controller.getStockDashboard);

module.exports = router;
