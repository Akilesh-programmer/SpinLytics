const asyncHandler = require('../middleware/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const stockService = require('../services/stock.service');

const create = asyncHandler(async (req, res) => {
  const transaction = await stockService.create(req.body);
  const response = ApiResponse.created(transaction, 'Stock transaction created');
  res.status(response.statusCode).json(response);
});

const getAll = asyncHandler(async (req, res) => {
  const result = await stockService.findAll(req.query);
  const response = ApiResponse.success(result, 'Stock transactions retrieved');
  res.status(response.statusCode).json(response);
});

const getById = asyncHandler(async (req, res) => {
  const transaction = await stockService.findById(req.params.id);
  const response = ApiResponse.success(transaction, 'Stock transaction retrieved');
  res.status(response.statusCode).json(response);
});

const update = asyncHandler(async (req, res) => {
  const transaction = await stockService.update(req.params.id, req.body);
  const response = ApiResponse.success(transaction, 'Stock transaction updated');
  res.status(response.statusCode).json(response);
});

const remove = asyncHandler(async (req, res) => {
  await stockService.remove(req.params.id);
  res.status(200).json({ success: true, message: 'Stock transaction deleted' });
});

const getCurrentStock = asyncHandler(async (req, res) => {
  const stock = await stockService.getCurrentStock();
  const response = ApiResponse.success(stock, 'Current stock retrieved');
  res.status(response.statusCode).json(response);
});

const getCurrentStockByMaterial = asyncHandler(async (req, res) => {
  const stock = await stockService.getCurrentStockByMaterial(req.params.materialType);
  const response = ApiResponse.success(stock, 'Material stock retrieved');
  res.status(response.statusCode).json(response);
});

const getLotWiseStock = asyncHandler(async (req, res) => {
  const stock = await stockService.getLotWiseStock();
  const response = ApiResponse.success(stock, 'Lot-wise stock retrieved');
  res.status(response.statusCode).json(response);
});

const getPartyWiseStock = asyncHandler(async (req, res) => {
  const stock = await stockService.getPartyWiseStock();
  const response = ApiResponse.success(stock, 'Party-wise stock retrieved');
  res.status(response.statusCode).json(response);
});

const getOpeningStock = asyncHandler(async (req, res) => {
  const stock = await stockService.getOpeningStock(req.params.date);
  const response = ApiResponse.success(stock, 'Opening stock retrieved');
  res.status(response.statusCode).json(response);
});

const getClosingStock = asyncHandler(async (req, res) => {
  const stock = await stockService.getClosingStock(req.params.date);
  const response = ApiResponse.success(stock, 'Closing stock retrieved');
  res.status(response.statusCode).json(response);
});

module.exports = {
  create, getAll, getById, update, remove,
  getCurrentStock, getCurrentStockByMaterial,
  getLotWiseStock, getPartyWiseStock,
  getOpeningStock, getClosingStock,
};
