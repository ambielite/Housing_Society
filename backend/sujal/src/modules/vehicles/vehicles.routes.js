const express = require('express');
const controller = require('./vehicles.controller');
const validate = require('../../common/validate');
const {
  createVehicleSchema,
  listVehiclesQuerySchema,
  updateVehicleSchema,
  updateVehicleStatusSchema,
  assignCredentialSchema,
  logEntrySchema,
  listVisitsQuerySchema,
} = require('./vehicles.validation');
const { authenticate, authorize } = require('../../common/authMiddleware');

const router = express.Router();

router.use(authenticate);

// Parking visits / gate log (entry-exit for vehicles at a slot)
// IMPORTANT: these static "/visits..." routes must be declared BEFORE
// the "/:vehicleId" routes below - otherwise Express matches "visits"
// as a :vehicleId value and this block never gets reached.
router.post('/visits/entry', authorize('PARKING_VISIT_CREATE'), validate(logEntrySchema), controller.logEntry);
router.get('/visits', authorize('PARKING_VISIT_READ'), validate(listVisitsQuerySchema, 'query'), controller.listVisits);
router.get('/visits/:visitId', authorize('PARKING_VISIT_READ'), controller.getVisit);
router.patch('/visits/:visitId/exit', authorize('PARKING_VISIT_UPDATE'), controller.logExit);

// Vehicles
router.get('/', authorize('VEHICLE_READ'), validate(listVehiclesQuerySchema, 'query'), controller.listVehicles);
router.post('/', authorize('VEHICLE_CREATE'), validate(createVehicleSchema), controller.createVehicle);
router.get('/:vehicleId', authorize('VEHICLE_READ'), controller.getVehicle);
router.patch('/:vehicleId', authorize('VEHICLE_UPDATE'), validate(updateVehicleSchema), controller.updateVehicle);
router.patch(
  '/:vehicleId/status',
  authorize('VEHICLE_UPDATE'),
  validate(updateVehicleStatusSchema),
  controller.updateVehicleStatus
);

// Access credentials
router.post(
  '/:vehicleId/credentials',
  authorize('VEHICLE_CREDENTIAL_ASSIGN'),
  validate(assignCredentialSchema),
  controller.assignCredential
);
router.get('/:vehicleId/credentials', authorize('VEHICLE_READ'), controller.listCredentials);
router.delete(
  '/:vehicleId/credentials/:credentialId',
  authorize('VEHICLE_CREDENTIAL_ASSIGN'),
  controller.revokeCredential
);

module.exports = router;