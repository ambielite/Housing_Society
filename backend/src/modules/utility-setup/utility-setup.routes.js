const express = require('express');
const controller = require('./utility-setup.controller');
const validate = require('../../common/validate');
const {
  createTypeSchema,
  listTypesQuerySchema,
  updateTypeSchema,
  createMeterSchema,
  listMetersQuerySchema,
  updateMeterSchema,
  replaceMeterSchema,
  createTariffSchema,
  updateTariffSchema,
} = require('./utility-setup.validation');
const { authenticate, authorize } = require('../../common/authMiddleware');

const router = express.Router();

router.use(authenticate);

// Meters (static prefix, declared before "/types/:typeId" below)
router.post('/meters', authorize('METER_CREATE'), validate(createMeterSchema), controller.createMeter);
router.get('/meters', authorize('METER_READ'), validate(listMetersQuerySchema, 'query'), controller.listMeters);
router.get('/meters/:meterId', authorize('METER_READ'), controller.getMeter);
router.put('/meters/:meterId', authorize('METER_UPDATE'), validate(updateMeterSchema), controller.updateMeter);
router.delete('/meters/:meterId', authorize('METER_DELETE'), controller.deleteMeter);
router.post(
  '/meters/:meterId/replace',
  authorize('METER_UPDATE'),
  validate(replaceMeterSchema),
  controller.replaceMeter
);

// Tariffs
router.post('/tariffs', authorize('UTILITY_TARIFF_CREATE'), validate(createTariffSchema), controller.createTariff);
router.put('/tariffs/:tariffId', authorize('UTILITY_TARIFF_UPDATE'), validate(updateTariffSchema), controller.updateTariff);
router.delete('/tariffs/:tariffId', authorize('UTILITY_TARIFF_DELETE'), controller.deleteTariff);

// Utility types
router.get('/types', authorize('UTILITY_TYPE_READ'), validate(listTypesQuerySchema, 'query'), controller.listTypes);
router.post('/types', authorize('UTILITY_TYPE_CREATE'), validate(createTypeSchema), controller.createType);
router.get('/types/:typeId', authorize('UTILITY_TYPE_READ'), controller.getType);
router.put('/types/:typeId', authorize('UTILITY_TYPE_UPDATE'), validate(updateTypeSchema), controller.updateType);
router.delete('/types/:typeId', authorize('UTILITY_TYPE_DELETE'), controller.deleteType);
router.get('/types/:typeId/tariffs', authorize('UTILITY_TARIFF_READ'), controller.listTariffs);

module.exports = router;
