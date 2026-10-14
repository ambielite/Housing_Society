const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const usersRoutes = require('../modules/users/users.routes');
const rbacRoutes = require('../modules/rbac/rbac.routes');

const parkingRoutes = require('../modules/parking/parking.routes');
const vehiclesRoutes = require('../modules/vehicles/vehicles.routes');


const vendorsRoutes = require('../modules/vendors/vendors.routes');
const approvalsRoutes = require('../modules/approvals/approvals.routes');
const procurementRoutes = require('../modules/procurement/procurement.routes');
const purchaseOrdersRoutes = require('../modules/purchase-orders/purchase-orders.routes');
const vendorInvoicesRoutes = require('../modules/purchase-orders/vendor-invoices.routes')

const gatesRoutes = require('../modules/gates/gates.routes');
const visitorsRoutes = require('../modules/visitors/visitors.routes');
const deliveriesRoutes = require('../modules/deliveries/deliveries.routes');

const amenitiesRoutes = require('../modules/amenities/amenities.routes');
const amenityBookingsRoutes = require('../modules/amenity-bookings/amenity-bookings.routes');

const helpdeskSetupRoutes = require('../modules/helpdesk-setup/helpdesk-setup.routes');
const ticketsRoutes = require('../modules/tickets/tickets.routes');
const slaRoutes = require('../modules/sla/sla.routes');

const documentFoldersRoutes = require('../modules/document-folders/document-folders.routes');
const documentAccessRoutes = require('../modules/document-access/document-access.routes');

const utilitySetupRoutes = require('../modules/utility-setup/utility-setup.routes');
const meterReadingsRoutes = require('../modules/meter-readings/meter-readings.routes');

const reportsCenterRoutes = require('../modules/reports-center/reports-center.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/rbac', rbacRoutes);



router.use('/parking', parkingRoutes);
router.use('/vehicles', vehiclesRoutes);

router.use('/vendors', vendorsRoutes);
router.use('/approvals', approvalsRoutes);
router.use('/procurement', procurementRoutes);
router.use('/purchase-orders', purchaseOrdersRoutes);
router.use('/vendor-invoices', vendorInvoicesRoutes);

router.use('/gates', gatesRoutes);
router.use('/visitors', visitorsRoutes);
router.use('/deliveries', deliveriesRoutes);

router.use('/amenities', amenitiesRoutes);
router.use('/amenity-bookings', amenityBookingsRoutes);

router.use('/helpdesk-setup', helpdeskSetupRoutes);
router.use('/tickets', ticketsRoutes);
router.use('/sla', slaRoutes);

router.use('/document-vault', documentFoldersRoutes);
router.use('/document-access', documentAccessRoutes);

router.use('/utilities', utilitySetupRoutes);
router.use('/meter-readings', meterReadingsRoutes);

router.use('/reports-center', reportsCenterRoutes);



module.exports = router;
