const express = require('express');
const { authenticate } = require('../../common/authMiddleware');
const controller = require('./resident-dashboard.controller');

const router = express.Router();

router.get('/events', authenticate, controller.streamEvents);
router.get('/notifications', authenticate, controller.listNotifications);
router.patch('/notifications/:id/read', authenticate, controller.markNotificationRead);
router.get('/', authenticate, controller.getDashboard);

module.exports = router;
