const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { apiService } = require('../services');

const listCounties = catchAsync(async (req, res) => {
  const result = await apiService.listCounties(req.body);
  res.send(result);
});

module.exports = {
  listCounties,
}