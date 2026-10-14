const express = require('express');
const controller = require('./meter-readings.controller');
const validate = require('../../common/validate');
const {
  submitReadingSchema,
  estimateReadingSchema,
  bulkReadingsSchema,
  listReadingsQuerySchema,
  rejectReadingSchema,
  adjustReadingSchema,
  createBillSchema,
  linkBillSchema,
} = require('./meter-readings.validation');
const { authenticate, authorize } = require('../../common/authMiddleware');

const router = express.Router();

router.use(authenticate);

// Static prefixes (/estimate, /bulk, /bills) must be declared BEFORE the
// "/:readingId" routes below, or Express treats them as a readingId.

router.post('/estimate', authorize('METER_READING_CREATE'), validate(estimateReadingSchema), controller.submitEstimatedReading);
router.post('/bulk', authorize('METER_READING_CREATE'), validate(bulkReadingsSchema), controller.submitBulkReadings);

// Utility bills
router.post('/bills', authorize('UTILITY_BILL_CREATE'), validate(createBillSchema), controller.createBill);
router.get('/bills/meter/:meterId', authorize('UTILITY_BILL_READ'), controller.listBillsForMeter);
router.get('/bills/:billId', authorize('UTILITY_BILL_READ'), controller.getBill);
router.patch('/bills/:billId/link', authorize('UTILITY_BILL_UPDATE'), validate(linkBillSchema), controller.linkBill);

// Readings
router.post('/', authorize('METER_READING_CREATE'), validate(submitReadingSchema), controller.submitReading);
router.get('/', authorize('METER_READING_READ'), validate(listReadingsQuerySchema, 'query'), controller.listReadings);
router.get('/:readingId', authorize('METER_READING_READ'), controller.getReading);
router.patch('/:readingId/validate', authorize('METER_READING_UPDATE'), controller.validateReading);
router.patch('/:readingId/reject', authorize('METER_READING_UPDATE'), validate(rejectReadingSchema), controller.rejectReading);
router.patch('/:readingId/adjust', authorize('METER_READING_UPDATE'), validate(adjustReadingSchema), controller.adjustReading);

module.exports = router;
