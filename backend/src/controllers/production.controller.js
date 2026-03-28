const asyncHandler = require('../middleware/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const productionService = require('../services/production.service');

const create = asyncHandler(async (req, res) => {
  const entry = await productionService.create(req.body);
  const response = ApiResponse.created(entry, 'Production entry created successfully');
  res.status(response.statusCode).json(response);
});

const getAll = asyncHandler(async (req, res) => {
  const result = await productionService.findAll(req.query);
  const response = ApiResponse.success(result, 'Production entries retrieved');
  res.status(response.statusCode).json(response);
});

const getById = asyncHandler(async (req, res) => {
  const entry = await productionService.findById(req.params.id);
  const response = ApiResponse.success(entry, 'Production entry retrieved');
  res.status(response.statusCode).json(response);
});

const getByDate = asyncHandler(async (req, res) => {
  const result = await productionService.findByDate(req.params.date);
  const response = ApiResponse.success(result, 'Daily production retrieved');
  res.status(response.statusCode).json(response);
});

const update = asyncHandler(async (req, res) => {
  const entry = await productionService.update(req.params.id, req.body);
  const response = ApiResponse.success(entry, 'Production entry updated');
  res.status(response.statusCode).json(response);
});

const remove = asyncHandler(async (req, res) => {
  await productionService.remove(req.params.id);
  res.status(200).json({ success: true, message: 'Production entry deleted' });
});

module.exports = { create, getAll, getById, getByDate, update, remove };
