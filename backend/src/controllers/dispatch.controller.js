const asyncHandler = require('../middleware/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const dispatchService = require('../services/dispatch.service');

const create = asyncHandler(async (req, res) => {
  const entry = await dispatchService.create(req.body);
  const response = ApiResponse.created(entry, 'Dispatch entry created');
  res.status(response.statusCode).json(response);
});

const getAll = asyncHandler(async (req, res) => {
  const result = await dispatchService.findAll(req.query);
  const response = ApiResponse.success(result, 'Dispatch entries retrieved');
  res.status(response.statusCode).json(response);
});

const getById = asyncHandler(async (req, res) => {
  const entry = await dispatchService.findById(req.params.id);
  const response = ApiResponse.success(entry, 'Dispatch entry retrieved');
  res.status(response.statusCode).json(response);
});

const update = asyncHandler(async (req, res) => {
  const entry = await dispatchService.update(req.params.id, req.body);
  const response = ApiResponse.success(entry, 'Dispatch entry updated');
  res.status(response.statusCode).json(response);
});

const remove = asyncHandler(async (req, res) => {
  await dispatchService.remove(req.params.id);
  res.status(200).json({ success: true, message: 'Dispatch entry deleted' });
});

module.exports = { create, getAll, getById, update, remove };
