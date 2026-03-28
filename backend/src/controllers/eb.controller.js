const asyncHandler = require('../middleware/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ebService = require('../services/eb.service');

const create = asyncHandler(async (req, res) => {
  const entry = await ebService.create(req.body);
  const response = ApiResponse.created(entry, 'EB entry created');
  res.status(response.statusCode).json(response);
});

const getAll = asyncHandler(async (req, res) => {
  const result = await ebService.findAll(req.query);
  const response = ApiResponse.success(result, 'EB entries retrieved');
  res.status(response.statusCode).json(response);
});

const getById = asyncHandler(async (req, res) => {
  const entry = await ebService.findById(req.params.id);
  const response = ApiResponse.success(entry, 'EB entry retrieved');
  res.status(response.statusCode).json(response);
});

const getByMonthYear = asyncHandler(async (req, res) => {
  const entry = await ebService.findByMonthYear(
    parseInt(req.params.month),
    parseInt(req.params.year)
  );
  const response = ApiResponse.success(entry, 'EB entry retrieved');
  res.status(response.statusCode).json(response);
});

const update = asyncHandler(async (req, res) => {
  const entry = await ebService.update(req.params.id, req.body);
  const response = ApiResponse.success(entry, 'EB entry updated');
  res.status(response.statusCode).json(response);
});

const remove = asyncHandler(async (req, res) => {
  await ebService.remove(req.params.id);
  res.status(200).json({ success: true, message: 'EB entry deleted' });
});

module.exports = { create, getAll, getById, getByMonthYear, update, remove };
