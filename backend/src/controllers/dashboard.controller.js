const asyncHandler = require('../middleware/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const dashboardService = require('../services/dashboard.service');

const getDailySummary = asyncHandler(async (req, res) => {
  const result = await dashboardService.getDailySummary(req.params.date);
  const response = ApiResponse.success(result, 'Daily dashboard retrieved');
  res.status(response.statusCode).json(response);
});

const getMonthlySummary = asyncHandler(async (req, res) => {
  const year = parseInt(req.params.year);
  const month = parseInt(req.params.month);
  const result = await dashboardService.getMonthlySummary(year, month);
  const response = ApiResponse.success(result, 'Monthly dashboard retrieved');
  res.status(response.statusCode).json(response);
});

const getYearlySummary = asyncHandler(async (req, res) => {
  const year = parseInt(req.params.year);
  const result = await dashboardService.getYearlySummary(year);
  const response = ApiResponse.success(result, 'Yearly dashboard retrieved');
  res.status(response.statusCode).json(response);
});

const getStockDashboard = asyncHandler(async (req, res) => {
  const result = await dashboardService.getStockDashboard();
  const response = ApiResponse.success(result, 'Stock dashboard retrieved');
  res.status(response.statusCode).json(response);
});

module.exports = { getDailySummary, getMonthlySummary, getYearlySummary, getStockDashboard };
