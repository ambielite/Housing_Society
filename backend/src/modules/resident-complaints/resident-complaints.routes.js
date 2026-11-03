const express = require('express');
const { authenticate } = require('../../common/authMiddleware');
const controller = require('./resident-complaints.controller');

const router = express.Router();

router.use(authenticate);
router.get('/categories', controller.listCategories);
router.get('/', controller.listComplaints);
router.post('/', controller.createComplaint);
router.get('/:ticketId', controller.getComplaint);

module.exports = router;
