import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute, { PublicOnlyRoute } from './ProtectedRoute';
import AppShell from '../../components/layout/AppShell';
const LoginPage = lazy(() => import('../../features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('../../features/auth/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../../features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../../features/auth/pages/ResetPasswordPage'));
const ChangePasswordPage = lazy(() => import('../../features/auth/pages/ChangePasswordPage'));
const DashboardPage = lazy(() => import('../../features/dashboard/pages/DashboardPage'));
const UserListPage = lazy(() => import('../../features/users/pages/UserListPage'));
const UserDetailPage = lazy(() => import('../../features/users/pages/UserDetailPage'));
const UserFormPage = lazy(() => import('../../features/users/pages/UserFormPage'));
const RoleListPage = lazy(() => import('../../features/rbac/pages/RoleListPage'));
const RoleDetailPage = lazy(() => import('../../features/rbac/pages/RoleDetailPage'));
const RoleFormPage = lazy(() => import('../../features/rbac/pages/RoleFormPage'));
const ParkingHomePage = lazy(() => import('../../features/parking/pages/ParkingHomePage'));
const AreaListPage = lazy(() => import('../../features/parking/pages/AreaListPage'));
const SlotListPage = lazy(() => import('../../features/parking/pages/SlotListPage'));
const AllocationListPage = lazy(() => import('../../features/parking/pages/AllocationListPage'));
const VehicleListPage = lazy(() => import('../../features/vehicles/pages/VehicleListPage'));
const VehicleDetailPage = lazy(() => import('../../features/vehicles/pages/VehicleDetailPage'));
const VehicleFormPage = lazy(() => import('../../features/vehicles/pages/VehicleFormPage'));
const GateLogPage = lazy(() => import('../../features/vehicles/pages/GateLogPage'));
const VendorListPage = lazy(() => import('../../features/vendors/pages/VendorListPage'));
const VendorDetailPage = lazy(() => import('../../features/vendors/pages/VendorDetailPage'));
const VendorFormPage = lazy(() => import('../../features/vendors/pages/VendorFormPage'));
const PurchaseRequestListPage = lazy(() => import('../../features/procurement/pages/PurchaseRequestListPage'));
const PurchaseRequestFormPage = lazy(() => import('../../features/procurement/pages/PurchaseRequestFormPage'));
const PurchaseRequestDetailPage = lazy(() => import('../../features/procurement/pages/PurchaseRequestDetailPage'));
const RfqDetailPage = lazy(() => import('../../features/procurement/pages/RfqDetailPage'));
const QuotationDetailPage = lazy(() => import('../../features/procurement/pages/QuotationDetailPage'));
const PurchaseOrderListPage = lazy(() => import('../../features/purchase-orders/pages/PurchaseOrderListPage'));
const PurchaseOrderFormPage = lazy(() => import('../../features/purchase-orders/pages/PurchaseOrderFormPage'));
const PurchaseOrderDetailPage = lazy(() => import('../../features/purchase-orders/pages/PurchaseOrderDetailPage'));
const ApprovalListPage = lazy(() => import('../../features/approvals/pages/ApprovalListPage'));
const ApprovalDetailPage = lazy(() => import('../../features/approvals/pages/ApprovalDetailPage'));
const SecurityPage = lazy(() => import('../../features/security/pages/SecurityPage'));
const AmenitiesHomePage = lazy(() => import('../../features/amenities/pages/AmenitiesHomePage'));
const AmenityListPage = lazy(() => import('../../features/amenities/pages/AmenityListPage'));
const AmenityDetailPage = lazy(() => import('../../features/amenities/pages/AmenityDetailPage'));
const AmenitySlotListPage = lazy(() => import('../../features/amenities/pages/SlotListPage'));
const AmenityBookingListPage = lazy(() => import('../../features/amenities/pages/BookingListPage'));
const AmenityBookingDetailPage = lazy(() => import('../../features/amenities/pages/BookingDetailPage'));
const HelpdeskHomePage = lazy(() => import('../../features/helpdesk/pages/HelpdeskHomePage'));
const TicketListPage = lazy(() => import('../../features/helpdesk/pages/TicketListPage'));
const TicketDetailPage = lazy(() => import('../../features/helpdesk/pages/TicketDetailPage'));
const HelpdeskSetupPage = lazy(() => import('../../features/helpdesk/pages/HelpdeskSetupPage'));
const DocumentVaultPage = lazy(() => import('../../features/document-vault/pages/DocumentVaultPage'));
const DocumentDetailPage = lazy(() => import('../../features/document-vault/pages/DocumentDetailPage'));
const UtilityMeterManagementPage = lazy(() => import('../../features/utilities/pages/UtilityMeterManagementPage'));
const ReportsCenterPage = lazy(() => import('../../features/reports-center/pages/ReportsCenterPage'));
// Nikhil's housing-management modules use the legacy /api namespace.
const SocietyListPage = lazy(() => import('../../features/societies/pages/SocietyListPage'));
const TowerListPage = lazy(() => import('../../features/towers/pages/TowerListPage'));
const FloorListPage = lazy(() => import('../../features/floors/pages/FloorListPage'));
const UnitListPage = lazy(() => import('../../features/units/pages/UnitListPage'));
const ResidentListPage = lazy(() => import('../../features/residents/pages/ResidentListPage'));
const ResidentHierarchyPage = lazy(() => import('../../features/residents/pages/ResidentHierarchyPage'));
const ResidentVerificationPage = lazy(() => import('../../features/residents/pages/ResidentVerificationPage'));
const NonMemberListPage = lazy(() => import('../../features/residents/pages/NonMemberListPage'));
const MoveInOutPage = lazy(() => import('../../features/moveInOut/pages/MoveInOutPage'));
const MoveInOutDashboardPage = lazy(() => import('../../features/moveInOut/pages/MoveInOutDashboardPage'));
const MoveInListPage = lazy(() => import('../../features/moveInOut/pages/MoveInListPage'));
const MoveOutListPage = lazy(() => import('../../features/moveInOut/pages/MoveOutListPage'));
const AgreementListPage = lazy(() => import('../../features/moveInOut/pages/AgreementListPage'));
const AgreementLifecyclePage = lazy(() => import('../../features/moveInOut/pages/AgreementLifecyclePage'));
const FinancePage = lazy(() => import('../../features/finance/pages/FinancePage'));
const FinanceDashboardPage = lazy(() => import('../../features/finance/pages/FinanceDashboardPage'));
const FinanceAccountsPage = lazy(() => import('../../features/finance/pages/FinanceAccountsPage'));
const FinanceJournalsPage = lazy(() => import('../../features/finance/pages/FinanceJournalsPage'));
const FinancePaymentsPage = lazy(() => import('../../features/finance/pages/FinancePaymentsPage'));
const FinanceLedgersPage = lazy(() => import('../../features/finance/pages/FinanceLedgersPage'));
const FinanceBillingPage = lazy(() => import('../../features/finance/pages/FinanceBillingPage'));
const FinanceInvoicesPage = lazy(() => import('../../features/finance/pages/FinanceInvoicesPage'));
const FinanceReportsPage = lazy(() => import('../../features/finance/pages/FinanceReportsPage'));
const FinanceReconciliationPage = lazy(() => import('../../features/finance/pages/FinanceReconciliationPage'));
const FinanceTaxesPage = lazy(() => import('../../features/finance/pages/FinanceTaxesPage'));
const FinanceExportsPage = lazy(() => import('../../features/finance/pages/FinanceExportsPage'));
const FinancePeriodsPage = lazy(() => import('../../features/finance/pages/FinancePeriodsPage'));
const OperationsSecurityPage = lazy(() => import('../../features/security/pages/OperationsSecurityPage'));
const AssetsPage = lazy(() => import('../../features/assets/pages/AssetsPage'));
const NotificationsPage = lazy(() => import('../../features/notifications/pages/NotificationsPage'));
const CommunityPage = lazy(() => import('../../features/community/pages/CommunityPage'));
const ReportsPage = lazy(() => import('../../features/reports/pages/ReportsWorkspace'));
const MultiSocietyPage = lazy(() => import('../../features/multiSociety/pages/MultiSocietyPage'));
const HousingDashboardPage = lazy(() => import('../../features/dashboard/pages/HousingDashboardPage'));

import useAuth from '../providers/useAuth';

function NotFound() {
  return (
    <div className="empty-state">
      <h1>Page not found</h1>
      <p>The address doesn't match any page. Use the menu to get back on track.</p>
    </div>
  );
}

function HomeRedirect() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="table-state">Loading page...</div>}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/housing-dashboard" element={<HousingDashboardPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route element={<ProtectedRoute permission="SOCIETY_READ" />}>
              <Route path="/societies" element={<SocietyListPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="TOWER_READ" />}><Route path="/towers" element={<TowerListPage />} /></Route>
            <Route element={<ProtectedRoute permission="FLOOR_READ" />}><Route path="/floors" element={<FloorListPage />} /></Route>
            <Route element={<ProtectedRoute permission="UNIT_READ" />}><Route path="/units" element={<UnitListPage />} /></Route>
            <Route element={<ProtectedRoute permission="RESIDENT_READ" />}>
              <Route path="/residents" element={<ResidentListPage />} />
              <Route path="/residents/list" element={<ResidentListPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="OWNER_UNIT_READ" />}><Route path="/residents/ownership" element={<ResidentHierarchyPage />} /></Route>
            <Route element={<ProtectedRoute permission="RESIDENT_VERIFICATION_READ" />}>
              <Route path="/residents/verification" element={<ResidentVerificationPage />} />
              <Route path="/residents/non-members" element={<NonMemberListPage />} />
            </Route>
            <Route element={<ProtectedRoute permission={['MOVE_IN_READ', 'MOVE_OUT_READ', 'AGREEMENT_READ', 'AGREEMENT_RENEWAL_READ', 'AGREEMENT_REMINDER_READ']} />}>
            <Route path="/move-in-out" element={<MoveInOutPage />}>
              <Route index element={<MoveInOutDashboardPage />} />
              <Route path="move-ins" element={<MoveInListPage />} />
              <Route path="move-outs" element={<MoveOutListPage />} />
              <Route path="agreements" element={<AgreementListPage />} />
              <Route path="renewals" element={<AgreementLifecyclePage />} />
            </Route>
            </Route>
            <Route element={<ProtectedRoute permission={['ACCOUNT_READ', 'BILLING_READ', 'INVOICE_READ', 'PAYMENT_READ', 'FINANCIAL_REPORT_READ', 'JOURNAL_READ', 'LEDGER_ACCOUNT_READ', 'GENERAL_LEDGER_READ', 'TAX_READ', 'RECONCILIATION_READ', 'ACCOUNTING_EXPORT_READ', 'ACCOUNTING_PERIOD_READ']} />}>
            <Route path="/finance" element={<FinancePage />}>
              <Route index element={<FinanceDashboardPage />} />
              <Route path="dashboard" element={<FinanceDashboardPage />} />
              <Route path="accounts" element={<FinanceAccountsPage />} />
              <Route path="journals" element={<FinanceJournalsPage />} />
              <Route path="payments" element={<FinancePaymentsPage />} />
              <Route path="ledgers" element={<FinanceLedgersPage />} />
              <Route path="billing" element={<FinanceBillingPage />} />
              <Route path="invoices" element={<FinanceInvoicesPage />} />
              <Route path="reports" element={<FinanceReportsPage />} />
              <Route path="reconciliation" element={<FinanceReconciliationPage />} />
              <Route path="taxes" element={<FinanceTaxesPage />} />
              <Route path="exports" element={<FinanceExportsPage />} />
              <Route path="periods" element={<FinancePeriodsPage />} />
            </Route>
            </Route>
            <Route element={<ProtectedRoute permission={['STAFF_READ', 'PATROL_READ', 'INCIDENT_READ', 'EMERGENCY_READ', 'SECURITY_AUDIT_READ']} />}>
              <Route path="/security-operations" element={<OperationsSecurityPage />} />
              <Route path="/security-operations/:section" element={<OperationsSecurityPage />} />
            </Route>
            <Route element={<ProtectedRoute permission={['ASSET_READ', 'INVENTORY_READ', 'ASSET_MAINTENANCE_READ', 'AMC_READ', 'WORK_ORDER_READ', 'MAINTENANCE_SCHEDULE_READ', 'ASSET_DOCUMENT_READ', 'ASSET_QR_READ', 'ASSET_LIFECYCLE_READ', 'ASSET_CATEGORY_READ']} />}>
              <Route path="/assets" element={<AssetsPage />} />
              <Route path="/assets/:section" element={<AssetsPage />} />
            </Route>
            <Route element={<ProtectedRoute permission={['NOTIFICATION_READ', 'NOTIFICATION_TEMPLATE_READ', 'NOTIFICATION_PREFERENCE_READ', 'BROADCAST_READ']} />}>
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/notifications/:section" element={<NotificationsPage />} />
            </Route>
            <Route element={<ProtectedRoute permission={['COMMUNITY_GROUP_READ', 'COMMUNITY_FORUM_READ', 'COMMUNITY_EVENT_READ', 'COMMUNITY_MEETING_READ', 'COMMUNITY_GOVERNANCE_READ', 'COMMUNITY_VOTING_READ']} />}>
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/community/:section" element={<CommunityPage />} />
            </Route>
            <Route element={<ProtectedRoute permission={['REPORT_DASHBOARD_READ', 'REPORT_FINANCE_READ', 'REPORT_OPERATIONS_READ', 'REPORT_SECURITY_READ', 'REPORT_APPROVAL_READ']} />}>
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/:section" element={<ReportsPage />} />
            </Route>
            <Route element={<ProtectedRoute permission={['ORGANIZATION_READ', 'CLUSTER_READ', 'MULTI_SOCIETY_READ']} />}>
              <Route path="/multi-society" element={<MultiSocietyPage />} />
              <Route path="/multi-society/:section" element={<MultiSocietyPage />} />
            </Route>
            {/* Users */}
            <Route element={<ProtectedRoute permission="USER_READ" />}>
              <Route path="/users" element={<UserListPage />} />
              <Route path="/users/:userId" element={<UserDetailPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="USER_CREATE" />}>
              <Route path="/users/new" element={<UserFormPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="USER_UPDATE" />}>
              <Route path="/users/:userId/edit" element={<UserFormPage />} />
            </Route>
            {/* Roles */}
            <Route element={<ProtectedRoute permission="ROLE_READ" />}>
              <Route path="/roles" element={<RoleListPage />} />
              <Route path="/roles/:roleId" element={<RoleDetailPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="ROLE_CREATE" />}>
              <Route path="/roles/new" element={<RoleFormPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="ROLE_UPDATE" />}>
              <Route path="/roles/:roleId/edit" element={<RoleFormPage />} />
            </Route>
            {/* Parking */}
            <Route element={<ProtectedRoute permission={['PARKING_AREA_READ', 'PARKING_SLOT_READ', 'PARKING_ALLOCATION_READ']} />}>
              <Route path="/parking" element={<ParkingHomePage />} />
            </Route>
            <Route element={<ProtectedRoute permission="PARKING_AREA_READ" />}>
              <Route path="/parking/areas" element={<AreaListPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="PARKING_SLOT_READ" />}>
              <Route path="/parking/slots" element={<SlotListPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="PARKING_ALLOCATION_READ" />}>
              <Route path="/parking/allocations" element={<AllocationListPage />} />
            </Route>
            {/* Vehicles */}
            <Route element={<ProtectedRoute permission="VEHICLE_READ" />}>
              <Route path="/vehicles" element={<VehicleListPage />} />
              <Route path="/vehicles/:vehicleId" element={<VehicleDetailPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="VEHICLE_CREATE" />}>
              <Route path="/vehicles/new" element={<VehicleFormPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="VEHICLE_UPDATE" />}>
              <Route path="/vehicles/:vehicleId/edit" element={<VehicleFormPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="PARKING_VISIT_READ" />}>
              <Route path="/vehicles/visits" element={<GateLogPage />} />
            </Route>
            {/* Vendors */}
            <Route element={<ProtectedRoute permission="VENDOR_READ" />}>
              <Route path="/vendors" element={<VendorListPage />} />
              <Route path="/vendors/:vendorId" element={<VendorDetailPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="VENDOR_CREATE" />}>
              <Route path="/vendors/new" element={<VendorFormPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="VENDOR_UPDATE" />}>
              <Route path="/vendors/:vendorId/edit" element={<VendorFormPage />} />
            </Route>
            {/* Procurement */}
            <Route element={<ProtectedRoute permission="PURCHASE_REQUEST_READ" />}>
              <Route path="/procurement" element={<Navigate to="/procurement/requests" replace />} />
              <Route path="/procurement/requests" element={<PurchaseRequestListPage />} />
              <Route path="/procurement/requests/:requestId" element={<PurchaseRequestDetailPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="PURCHASE_REQUEST_CREATE" />}>
              <Route path="/procurement/requests/new" element={<PurchaseRequestFormPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="RFQ_READ" />}>
              <Route path="/procurement/rfqs/:rfqId" element={<RfqDetailPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="QUOTATION_READ" />}>
              <Route path="/procurement/quotations/:quotationId" element={<QuotationDetailPage />} />
            </Route>
            {/* Purchase Orders */}
            <Route element={<ProtectedRoute permission="PURCHASE_ORDER_READ" />}>
              <Route path="/purchase-orders" element={<PurchaseOrderListPage />} />
              <Route path="/purchase-orders/:poId" element={<PurchaseOrderDetailPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="PURCHASE_ORDER_CREATE" />}>
              <Route path="/purchase-orders/new" element={<PurchaseOrderFormPage />} />
            </Route>
            {/* Approvals */}
            <Route element={<ProtectedRoute permission="APPROVAL_READ" />}>
              <Route path="/approvals" element={<ApprovalListPage />} />
              <Route path="/approvals/:approvalRequestId" element={<ApprovalDetailPage />} />
            </Route>

             {/* Phase 9 - Security, Gate, Visitor & Delivery */}
            <Route element={<ProtectedRoute permission={['GATE_READ', 'VISITOR_PROFILE_READ', 'DELIVERY_READ']} />}>
              <Route path="/security" element={<SecurityPage />} />
            </Route>

            {/* Phase 12 - Amenities & Booking */}
            <Route element={<ProtectedRoute permission={['AMENITY_READ', 'AMENITY_SLOT_READ', 'AMENITY_BOOKING_READ']} />}>
              <Route path="/amenities" element={<AmenitiesHomePage />} />
            </Route>
            <Route element={<ProtectedRoute permission="AMENITY_READ" />}>
              <Route path="/amenities/list" element={<AmenityListPage />} />
              <Route path="/amenities/:amenityId" element={<AmenityDetailPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="AMENITY_SLOT_READ" />}>
              <Route path="/amenities/slots" element={<AmenitySlotListPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="AMENITY_BOOKING_READ" />}>
              <Route path="/amenities/bookings" element={<AmenityBookingListPage />} />
              <Route path="/amenities/bookings/:bookingId" element={<AmenityBookingDetailPage />} />
            </Route>

           {/* Phase 13 — Helpdesk, SLA & Escalation */}
            <Route element={<ProtectedRoute permission="TICKET_READ" />}>
              <Route path="/helpdesk" element={<HelpdeskHomePage />} />
              <Route path="/helpdesk/tickets" element={<TicketListPage />} />
              <Route path="/helpdesk/tickets/:ticketId" element={<TicketDetailPage />} />
            </Route>
            <Route element={<ProtectedRoute permission={['SLA_POLICY_READ', 'TICKET_CATEGORY_READ', 'ESCALATION_RULE_READ']} />}>
              <Route path="/helpdesk/setup" element={<HelpdeskSetupPage />} />
            </Route>


             {/* Phase 16 — Document Vault */}
            <Route element={<ProtectedRoute />}>
              <Route path="/document-vault" element={<DocumentVaultPage />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/document-vault/:documentId" element={<DocumentDetailPage />} />
            </Route>


             {/* Utility & Meter Management */}
            <Route element={<ProtectedRoute permission={['UTILITY_TYPE_READ', 'METER_READ', 'METER_READING_READ', 'UTILITY_TARIFF_READ', 'UTILITY_BILL_READ']} />}>
              <Route path="/utilities" element={<UtilityMeterManagementPage />} />
            </Route>


            {/* Phase 17 — Reports Center (your report endpoints) */}
            <Route element={<ProtectedRoute permission={['REPORT_DASHBOARD_READ', 'REPORT_OPERATIONS_READ', 'REPORT_SECURITY_READ', 'REPORT_HELPDESK_READ', 'REPORT_VENDOR_READ', 'REPORT_PROCUREMENT_READ', 'REPORT_AMENITY_READ', 'REPORT_UTILITY_READ']} />}>
              <Route path="/reports-center" element={<ReportsCenterPage />} />
            </Route>





            {/* Each new module adds its routes here, wrapped in <ProtectedRoute permission="..." /> */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>

        <Route path="/" element={<HomeRedirect />} />
      </Routes>
    </Suspense>
  );
}
