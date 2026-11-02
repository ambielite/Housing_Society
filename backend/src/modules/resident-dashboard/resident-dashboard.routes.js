const express = require('express');
const { authenticate } = require('../../common/authMiddleware');
const controller = require('./resident-dashboard.controller');

const router = express.Router();

router.get('/', authenticate, controller.getDashboard);

module.exports = router;
