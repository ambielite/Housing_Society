import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute, { PublicOnlyRoute } from './ProtectedRoute';
import AppShell from '../../components/layout/AppShell';
import LoginPage from '../../features/auth/pages/LoginPage';
import RegisterPage from '../../features/auth/pages/RegisterPage';
import ForgotPasswordPage from '../../features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '../../features/auth/pages/ResetPasswordPage';
import ChangePasswordPage from '../../features/auth/pages/ChangePasswordPage';
import DashboardPage from '../../features/dashboard/pages/DashboardPage';
import UserListPage from '../../features/users/pages/UserListPage';
import UserDetailPage from '../../features/users/pages/UserDetailPage';
import UserFormPage from '../../features/users/pages/UserFormPage';
import RoleListPage from '../../features/rbac/pages/RoleListPage';
import RoleDetailPage from '../../features/rbac/pages/RoleDetailPage';
import RoleFormPage from '../../features/rbac/pages/RoleFormPage';
import ParkingHomePage from '../../features/parking/pages/ParkingHomePage';
import AreaListPage from '../../features/parking/pages/AreaListPage';
import SlotListPage from '../../features/parking/pages/SlotListPage';
import AllocationListPage from '../../features/parking/pages/AllocationListPage';
import VehicleListPage from '../../features/vehicles/pages/VehicleListPage';
import VehicleDetailPage from '../../features/vehicles/pages/VehicleDetailPage';
import VehicleFormPage from '../../features/vehicles/pages/VehicleFormPage';
import GateLogPage from '../../features/vehicles/pages/GateLogPage';
import VendorListPage from '../../features/vendors/pages/VendorListPage';
import VendorDetailPage from '../../features/vendors/pages/VendorDetailPage';
import VendorFormPage from '../../features/vendors/pages/VendorFormPage';
import PurchaseRequestListPage from '../../features/procurement/pages/PurchaseRequestListPage';
import PurchaseRequestFormPage from '../../features/procurement/pages/PurchaseRequestFormPage';
import PurchaseRequestDetailPage from '../../features/procurement/pages/PurchaseRequestDetailPage';
import RfqDetailPage from '../../features/procurement/pages/RfqDetailPage';
import QuotationDetailPage from '../../features/procurement/pages/QuotationDetailPage';
import PurchaseOrderListPage from '../../features/purchase-orders/pages/PurchaseOrderListPage';
import PurchaseOrderFormPage from '../../features/purchase-orders/pages/PurchaseOrderFormPage';
import PurchaseOrderDetailPage from '../../features/purchase-orders/pages/PurchaseOrderDetailPage';
import ApprovalListPage from '../../features/approvals/pages/ApprovalListPage';
import ApprovalDetailPage from '../../features/approvals/pages/ApprovalDetailPage';
import SecurityPage from '../../features/security/pages/SecurityPage';
import AmenitiesHomePage from '../../features/amenities/pages/AmenitiesHomePage';
import AmenityListPage from '../../features/amenities/pages/AmenityListPage';
import AmenityDetailPage from '../../features/amenities/pages/AmenityDetailPage';
import AmenitySlotListPage from '../../features/amenities/pages/SlotListPage';
import AmenityBookingListPage from '../../features/amenities/pages/BookingListPage';
import AmenityBookingDetailPage from '../../features/amenities/pages/BookingDetailPage';
import HelpdeskHomePage from '../../features/helpdesk/pages/HelpdeskHomePage';
import TicketListPage from '../../features/helpdesk/pages/TicketListPage';
import TicketDetailPage from '../../features/helpdesk/pages/TicketDetailPage';
import HelpdeskSetupPage from '../../features/helpdesk/pages/HelpdeskSetupPage';
import DocumentVaultPage from '../../features/document-vault/pages/DocumentVaultPage';
import DocumentDetailPage from '../../features/document-vault/pages/DocumentDetailPage';
import UtilityMeterManagementPage from '../../features/utilities/pages/UtilityMeterManagementPage';
import ReportsCenterPage from '../../features/reports-center/pages/ReportsCenterPage';
// Nikhil's housing-management modules use the legacy /api namespace.
import SocietyListPage from '../../features/societies/pages/SocietyListPage';
import TowerListPage from '../../features/towers/pages/TowerListPage';
import FloorListPage from '../../features/floors/pages/FloorListPage';
import UnitListPage from '../../features/units/pages/UnitListPage';
import ResidentListPage from '../../features/residents/pages/ResidentListPage';
import ResidentHierarchyPage from '../../features/residents/pages/ResidentHierarchyPage';
import ResidentVerificationPage from '../../features/residents/pages/ResidentVerificationPage';
import NonMemberListPage from '../../features/residents/pages/NonMemberListPage';
import MoveInOutPage from '../../features/moveInOut/pages/MoveInOutPage';
import MoveInOutDashboardPage from '../../features/moveInOut/pages/MoveInOutDashboardPage';
import MoveInListPage from '../../features/moveInOut/pages/MoveInListPage';
import MoveOutListPage from '../../features/moveInOut/pages/MoveOutListPage';
import AgreementListPage from '../../features/moveInOut/pages/AgreementListPage';
import AgreementLifecyclePage from '../../features/moveInOut/pages/AgreementLifecyclePage';
import FinancePage from '../../features/finance/pages/FinancePage';
import FinanceDashboardPage from '../../features/finance/pages/FinanceDashboardPage';
import FinanceAccountsPage from '../../features/finance/pages/FinanceAccountsPage';
import FinanceJournalsPage from '../../features/finance/pages/FinanceJournalsPage';
import FinancePaymentsPage from '../../features/finance/pages/FinancePaymentsPage';
import FinanceLedgersPage from '../../features/finance/pages/FinanceLedgersPage';
import FinanceBillingPage from '../../features/finance/pages/FinanceBillingPage';
import FinanceInvoicesPage from '../../features/finance/pages/FinanceInvoicesPage';
import FinanceReportsPage from '../../features/finance/pages/FinanceReportsPage';
import FinanceReconciliationPage from '../../features/finance/pages/FinanceReconciliationPage';
import FinanceTaxesPage from '../../features/finance/pages/FinanceTaxesPage';
import FinanceExportsPage from '../../features/finance/pages/FinanceExportsPage';
import FinancePeriodsPage from '../../features/finance/pages/FinancePeriodsPage';
import OperationsSecurityPage from '../../features/security/pages/OperationsSecurityPage';
import AssetsPage from '../../features/assets/pages/AssetsPage';
import NotificationsPage from '../../features/notifications/pages/NotificationsPage';
import CommunityPage from '../../features/community/pages/CommunityPage';
import ReportsPage from '../../features/reports/pages/ReportsWorkspace';
import MultiSocietyPage from '../../features/multiSociety/pages/MultiSocietyPage';
import HousingDashboardPage from '../../features/dashboard/pages/HousingDashboardPage';

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
          <Route element={<ProtectedRoute permission={['DOCUMENT_FOLDER_READ', 'DOCUMENT_READ']} />}>
            <Route path="/document-vault" element={<DocumentVaultPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="DOCUMENT_READ" />}>
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
  );
}
