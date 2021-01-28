const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const apiController = require('../../controllers/api.controller');

const router = express.Router();

router
  .route('/listcounties/')
  .post(apiController.listCounties)
router
  .route('/listschools/')
  .get(apiController.listSchools)
router
  .route('/listscores/')
  .get(apiController.listScores)


module.exports = router;