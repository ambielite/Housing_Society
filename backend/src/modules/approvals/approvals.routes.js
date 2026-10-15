const express = require('express');
const controller = require('./approvals.controller');
const validate = require('../../common/validate');
const { raiseApprovalSchema, listRequestsQuerySchema, decideSchema } = require('./approvals.validation');
const { authenticate, authorize } = require('../../common/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('APPROVAL_CREATE'), validate(raiseApprovalSchema), controller.raiseApproval);
router.get('/', authorize('APPROVAL_READ'), validate(listRequestsQuerySchema, 'query'), controller.listRequests);
router.get('/:approvalRequestId', authorize('APPROVAL_READ'), controller.getRequest);
router.post('/:approvalRequestId/decide', authorize('APPROVAL_ACTION'), validate(decideSchema), controller.decide);
router.post('/:approvalRequestId/cancel', authorize('APPROVAL_CREATE'), controller.cancel);

module.exports = router;
