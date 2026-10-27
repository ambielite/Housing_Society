const express = require('express');
const controller = require('./societyBankAccount.controller');

const router = express.Router();
router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.deactivate);

module.exports = router;
