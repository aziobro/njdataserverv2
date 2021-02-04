const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { apiService } = require('../services');

const listCounties = catchAsync(async (req, res) => {
  console.log(req);
  const filter = pick(req.body, ['CountyCode']);
  console.log(filter);
  const result = await apiService.listCounties(filter);
  res.send(result);
});

const listSchools = catchAsync(async (req, res) => {
  console.log(req);
  const filter = pick(req.body, ['CountyCode', 'DistrictCode', 'CDS', '_id']);
  const result = await apiService.listSchools(filter);
  res.send(result);
});

const listScores = catchAsync(async (req, res) => {
  console.log(req);
  const filter = pick(req.body, ['CountyCode', 'DistrictCode', 'CDS', 'scores.k']);
  console.log(filter);
  const result = await apiService.listScores(filter);
  res.send(result);
});

module.exports = {
  listCounties,
  listSchools,
  listScores,
};
