const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { apiService } = require('../services');

const listCounties = catchAsync(async (req, res) => {
  console.log(req.query);
  const filter = pick(req.query,['CountyCode'])
  console.log(filter);
  const result = await apiService.listCounties(filter);
  res.send(result);
});

module.exports = {
  listCounties,
}