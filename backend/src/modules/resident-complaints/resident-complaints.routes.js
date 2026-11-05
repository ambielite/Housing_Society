const express = require('express');
const { authenticate } = require('../../common/authMiddleware');
const controller = require('./resident-complaints.controller');

const router = express.Router();

router.use(authenticate);
router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});
router.get('/categories', controller.listCategories);
router.get('/events', controller.streamStatusUpdates);
router.get('/', controller.listComplaints);
router.post('/', controller.createComplaint);
router.get('/:ticketId', controller.getComplaint);

module.exports = router;
