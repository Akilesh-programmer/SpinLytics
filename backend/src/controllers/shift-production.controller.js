const asyncHandler = require('../middleware/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const shiftProductionService = require('../services/shift-production.service');

const createSingle = asyncHandler(async (req, res) => {
  const entry = await shiftProductionService.createSingle(req.body);
  const response = ApiResponse.created(entry, 'Shift production entry created successfully');
  res.status(response.statusCode).json(response);
});

const createBatch = asyncHandler(async (req, res) => {
  const entries = await shiftProductionService.createBatch(req.body);
  const response = ApiResponse.created(entries, `${entries.length} shift production entries created successfully`);
  res.status(response.statusCode).json(response);
});

const getAll = asyncHandler(async (req, res) => {
  const result = await shiftProductionService.findAll(req.query);
  const response = ApiResponse.success(result, 'Shift production entries retrieved');
  res.status(response.statusCode).json(response);
});

const getByDate = asyncHandler(async (req, res) => {
  const result = await shiftProductionService.findByDate(req.params.date);
  const response = ApiResponse.success(result, 'Daily shift production retrieved');
  res.status(response.statusCode).json(response);
});

const getById = asyncHandler(async (req, res) => {
  const entry = await shiftProductionService.findById(req.params.id);
  const response = ApiResponse.success(entry, 'Shift production entry retrieved');
  res.status(response.statusCode).json(response);
});

const update = asyncHandler(async (req, res) => {
  const entry = await shiftProductionService.update(req.params.id, req.body);
  const response = ApiResponse.success(entry, 'Shift production entry updated');
  res.status(response.statusCode).json(response);
});

const remove = asyncHandler(async (req, res) => {
  await shiftProductionService.remove(req.params.id);
  res.status(200).json({ success: true, message: 'Shift production entry deleted' });
});

module.exports = { createSingle, createBatch, getAll, getByDate, getById, update, remove };
