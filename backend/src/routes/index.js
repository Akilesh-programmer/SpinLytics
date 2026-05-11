const express = require('express');
const router = express.Router();

const shiftProductionRoutes = require('./shift-production.routes');
const stockRoutes = require('./stock.routes');
const packingRoutes = require('./packing.routes');
const dispatchRoutes = require('./dispatch.routes');
const ebRoutes = require('./eb.routes');
const dashboardRoutes = require('./dashboard.routes');

// Mount all module routes
router.use('/shift-production', shiftProductionRoutes);
router.use('/stock', stockRoutes);
router.use('/packing', packingRoutes);
router.use('/dispatch', dispatchRoutes);
router.use('/eb', ebRoutes);
router.use('/dashboard', dashboardRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SpinLytics API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
