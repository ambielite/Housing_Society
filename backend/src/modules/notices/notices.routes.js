const express = require('express');
const controller = require('./notices.controller');

const router = express.Router();

router.get('/', controller.list);
router.get('/templates', controller.templates);
router.post('/templates/:templateId/notices', controller.createFromTemplate);
router.post('/', controller.create);
router.get('/:id', controller.get);
router.put('/:id', controller.update);
router.post('/:id/read', controller.markRead);
router.post('/:id/expire', controller.expire);
router.post('/:id/renotify', controller.renotify);
router.post('/:id/template', controller.saveTemplate);

module.exports = router;
