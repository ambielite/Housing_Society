import {
    BrowserRouter,
    Navigate,
    Route,
    Routes
} from "react-router-dom";

import AppShell from "../../components/layout/AppShell";
import SocietyListPage from "../../features/societies/pages/SocietyListPage";
import DashboardPage from "../../features/dashboard/pages/DashboardPage";
import TowerListPage from "../../features/towers/pages/TowerListPage";
import FloorListPage from "../../features/floors/pages/FloorListPage";
import UnitListPage from "../../features/units/pages/UnitListPage";
import ResidentListPage from "../../features/residents/pages/ResidentListPage";
import ResidentHierarchyPage from "../../features/residents/pages/ResidentHierarchyPage";
import ResidentVerificationPage from "../../features/residents/pages/ResidentVerificationPage";
import NonMemberListPage from "../../features/residents/pages/NonMemberListPage";
import MoveInOutPage from "../../features/moveInOut/pages/MoveInOutPage";
import MoveInOutDashboardPage from "../../features/moveInOut/pages/MoveInOutDashboardPage";
import MoveInListPage from "../../features/moveInOut/pages/MoveInListPage";
import MoveOutListPage from "../../features/moveInOut/pages/MoveOutListPage";
import AgreementListPage from "../../features/moveInOut/pages/AgreementListPage";
import AgreementLifecyclePage from "../../features/moveInOut/pages/AgreementLifecyclePage";
import FinancePage from "../../features/finance/pages/FinancePage";
import FinanceDashboardPage from "../../features/finance/pages/FinanceDashboardPage";
import FinanceAccountsPage from "../../features/finance/pages/FinanceAccountsPage";
import FinanceJournalsPage from "../../features/finance/pages/FinanceJournalsPage";
import FinancePaymentsPage from "../../features/finance/pages/FinancePaymentsPage";
import FinanceLedgersPage from "../../features/finance/pages/FinanceLedgersPage";
import FinanceBillingPage from "../../features/finance/pages/FinanceBillingPage";
import FinanceInvoicesPage from "../../features/finance/pages/FinanceInvoicesPage";
import FinanceReportsPage from "../../features/finance/pages/FinanceReportsPage";
import FinanceReconciliationPage from "../../features/finance/pages/FinanceReconciliationPage";
import FinanceTaxesPage from "../../features/finance/pages/FinanceTaxesPage";
import FinanceExportsPage from "../../features/finance/pages/FinanceExportsPage";
import FinancePeriodsPage from "../../features/finance/pages/FinancePeriodsPage";
import SecurityPage from "../../features/security/pages/SecurityPage";
import AssetsPage from "../../features/assets/pages/AssetsPage";
import NotificationsPage from "../../features/notifications/pages/NotificationsPage";
import CommunityPage from "../../features/community/pages/CommunityPage";
import ReportsPage from "../../features/reports/pages/ReportsWorkspace";
import MultiSocietyPage from "../../features/multiSociety/pages/MultiSocietyPage";

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<AppShell />}>
                    <Route path="/dashboard" element={<DashboardPage />} />

                    <Route index element={<Navigate to="/dashboard" replace />} />

                    <Route path="/societies" element={<SocietyListPage />} />
                    <Route path="/towers" element={<TowerListPage />} />
                    <Route path="/floors" element={<FloorListPage />} />
                    <Route path="/units" element={<UnitListPage />} />
                    <Route path="/security" element={<SecurityPage />} />
                    <Route path="/security/:section" element={<SecurityPage />} />
                    <Route path="/assets" element={<AssetsPage />} />
                    <Route path="/assets/:section" element={<AssetsPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/notifications/:section" element={<NotificationsPage />} />
                    <Route path="/community" element={<CommunityPage />} />
                    <Route path="/community/:section" element={<CommunityPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/reports/:section" element={<ReportsPage />} />
                    <Route path="/multi-society" element={<MultiSocietyPage />} />
                    <Route path="/multi-society/:section" element={<MultiSocietyPage />} />

                    <Route path="/residents" element={<ResidentListPage />} />
                    <Route path="/residents/list" element={<ResidentListPage />} />
                    <Route path="/residents/ownership" element={<ResidentHierarchyPage />} />
                    <Route path="/residents/verification" element={<ResidentVerificationPage />} />
                    <Route path="/residents/non-members" element={<NonMemberListPage />} />

                    <Route path="/move-in-out" element={<MoveInOutPage />}>
                        <Route index element={<MoveInOutDashboardPage />} />
                        <Route path="move-ins" element={<MoveInListPage />} />
                        <Route path="move-outs" element={<MoveOutListPage />} />
                        <Route path="agreements" element={<AgreementListPage />} />
                        <Route path="renewals" element={<AgreementLifecyclePage />} />
                    </Route>

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

                    <Route path="*" element={<div className="placeholder-page">This module will be implemented soon.</div>} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;

