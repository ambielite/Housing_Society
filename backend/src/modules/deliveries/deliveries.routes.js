const express = require('express');
const controller = require('./deliveries.controller');
const validate = require('../../common/validate');
const {
  createDeliverySchema,
  listDeliveriesQuerySchema,
  updateDeliveryStatusSchema,
  createParcelSchema,
  listParcelsQuerySchema,
  updateParcelStatusSchema,
} = require('./deliveries.validation');
const { authenticate, authorize } = require('../../common/authMiddleware');

const router = express.Router();

router.use(authenticate);

// Parcels (static prefix, declared before "/:deliveryId" below)
router.post('/parcels', authorize('PARCEL_CREATE'), validate(createParcelSchema), controller.createParcel);
router.get('/parcels', authorize('PARCEL_READ'), validate(listParcelsQuerySchema, 'query'), controller.listParcels);
router.get('/parcels/:parcelId', authorize('PARCEL_READ'), controller.getParcel);
router.patch(
  '/parcels/:parcelId/status',
  authorize('PARCEL_UPDATE'),
  validate(updateParcelStatusSchema),
  controller.updateParcelStatus
);

// Deliveries
router.get('/', authorize('DELIVERY_READ'), validate(listDeliveriesQuerySchema, 'query'), controller.listDeliveries);
router.post('/', authorize('DELIVERY_CREATE'), validate(createDeliverySchema), controller.createDelivery);
router.get('/:deliveryId', authorize('DELIVERY_READ'), controller.getDelivery);
router.patch(
  '/:deliveryId/status',
  authorize('DELIVERY_UPDATE'),
  validate(updateDeliveryStatusSchema),
  controller.updateDeliveryStatus
);

module.exports = router;
