const asyncHandler = require('../middleware/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const packingService = require('../services/packing.service');

const create = asyncHandler(async (req, res) => {
  const entry = await packingService.create(req.body);
  const response = ApiResponse.created(entry, 'Packing entry created');
  res.status(response.statusCode).json(response);
});

const getAll = asyncHandler(async (req, res) => {
  const result = await packingService.findAll(req.query);
  const response = ApiResponse.success(result, 'Packing entries retrieved');
  res.status(response.statusCode).json(response);
});

const getById = asyncHandler(async (req, res) => {
  const entry = await packingService.findById(req.params.id);
  const response = ApiResponse.success(entry, 'Packing entry retrieved');
  res.status(response.statusCode).json(response);
});

const update = asyncHandler(async (req, res) => {
  const entry = await packingService.update(req.params.id, req.body);
  const response = ApiResponse.success(entry, 'Packing entry updated');
  res.status(response.statusCode).json(response);
});

const remove = asyncHandler(async (req, res) => {
  await packingService.remove(req.params.id);
  res.status(200).json({ success: true, message: 'Packing entry deleted' });
});

module.exports = { create, getAll, getById, update, remove };
