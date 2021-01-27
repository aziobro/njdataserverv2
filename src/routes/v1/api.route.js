const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const apiController = require('../../controllers/api.controller');

const router = express.Router();

router
  .route('/api/listcounties/')
  .get(apiController.listCounties)


module.exports = router;