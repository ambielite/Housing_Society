const express = require("express");
const app = express();
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const requestId = require("./common/requestId");
const { pool } = require("./config/db");
const sequelize = require("./config/database");
const sujalApiRoutes = require("./routes");
const { notFoundHandler, errorHandler } = require("./common/errorHandler");
const { authenticate } = require("./common/authMiddleware");
const ApiError = require("./common/ApiError");
const { authorizeLegacyRequest } = require("./common/legacyAuthorization");

app.use(requestId);
app.use(helmet());
morgan.token("reqid", (req) => req.id);
app.use(morgan(process.env.NODE_ENV === "production" ? ":reqid :method :url :status :response-time ms" : "dev"));

// Keep browser origins explicit. Add deployed frontend URLs with the
// comma-separated CORS_ORIGINS environment variable.
const corsOrigins =
    process.env.CORS_ORIGINS ||
    process.env.CORS_ORIGIN ||
    "http://localhost:5173,http://127.0.0.1:5173";
const allowAnyOrigin = corsOrigins.trim() === "*";
const allowedOrigins = new Set(
    corsOrigins
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
);

app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && !allowAnyOrigin && !allowedOrigins.has(origin)) {
        return res.status(403).json({
            success: false,
            message: `Origin ${origin} is not allowed by CORS.`
        });
    }

    if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
    }

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Society-Id"
    );
    res.setHeader("Access-Control-Max-Age", "86400");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// All legacy Nikhil module routes are mounted directly under /api and do not
// carry per-route authentication. Protect that API surface while preserving
// the public login/refresh routes in the versioned /api/v1 API.
app.use("/api", (req, res, next) => {
    if (req.path === "/v1" || req.path.startsWith("/v1/")) return next();
    return authenticate(req, res, (error) => {
        if (error) return next(error);
        const requestedSocietyId = req.query.societyId || req.body?.societyId || req.get("x-society-id");
        if (requestedSocietyId && requestedSocietyId !== req.user.societyId) {
            return next(new ApiError(403, "Request society must match the active society"));
        }
        return authorizeLegacyRequest(req, res, next);
    });
});

app.use(
    "/uploads/profile-pictures",
    (req, res, next) => {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        next();
    },
    express.static(path.join(process.cwd(), "uploads", "profile-pictures"))
);

app.use(
    "/uploads/society-logos",
    (req, res, next) => {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        next();
    },
    express.static(path.join(process.cwd(), "uploads", "society-logos"))
);

app.use(
    "/uploads",
    express.static(
        path.join(
            process.cwd(),
            "uploads"
        )
    )
);


const societyRoutes = require("./modules/societies/society/society.routes");
const societyEmergencyContactRoutes = require("./modules/societies/emergency-contact/societyEmergencyContact.routes");
const societyCommitteeRoutes = require("./modules/societies/management-committee/societyCommittee.routes");
const towerRoutes = require("./modules/societies/tower/tower.routes");
const floorRoutes = require("./modules/societies/floor/floor.routes");
const unitRoutes = require("./modules/societies/unit/unit.routes");
const societySettingsRoutes = require("./modules/societies/society-settings/society-settings.routes");
const moveInRoutes = require("./modules/move-InOut/move-in/moveIn.routes");
const moveOutRoutes = require("./modules/move-InOut/move-out/moveOut.routes");
const occupancyRoutes = require("./modules/move-InOut/occupancy/occupancy.routes");     
const lifecycleApprovalRoutes = require("./modules/move-InOut/lifecycle-approval/lifecycleApproval.routes");
const lifecycleDocumentRoutes = require("./modules/move-InOut/lifecycle-document/lifecycleDocument.routes");    
const gatePassRoutes = require("./modules/move-InOut/gate-pass/gatePass.routes");   
const accessAssignmentRoutes = require("./modules/move-InOut/access/accessAssignment.routes");
const billingResponsibilityRoutes = require("./modules/move-InOut/billing-responsibility/billingResponsibility.routes");    
const financialClearanceRoutes = require("./modules/move-InOut/financial-clearance/financialClearance.routes"); 
const lifecycleAuditRoutes = require("./modules/move-InOut/lifecycle-audit/lifecycleAudit.routes");
const agreementRoutes = require("./modules/move-InOut/agreement/agreement.routes");
const agreementRenewalRoutes = require("./modules/move-InOut/agreement-renewal/agreementRenewal.routes");
const agreementReminderRoutes = require("./modules/move-InOut/agreement-reminder/agreementReminder.routes");
const agreementNotificationRoutes = require("./modules/move-InOut/agreement-notification/agreementNotification.routes");
const accountRoutes = require("./modules/financial/account/account.routes");
const accountingPeriodRoutes =require("./modules/financial/accounting-period/accountingPeriod.routes");
const journalRoutes = require("./modules/financial/journal/journal.routes"); 
const ledgerAccountRoutes = require("./modules/financial/ledger-account/ledgerAccount.routes");
const generalLedgerRoutes = require("./modules/financial/general-ledger/generalLedger.routes");
const trialBalanceRoutes = require("./modules/financial/trial-balance/trialBalance.routes");
const financialReportRoutes = require("./modules/financial/financial-report/financialReport.routes");
const billingRoutes = require("./modules/financial/billing/billing.routes");
const billingConfigRoutes = require("./modules/financial/billing-config/billingConfig.routes");
const invoiceRoutes = require("./modules/financial/invoice/invoice.routes");
const billingScheduleRoutes = require("./modules/financial/billing-scheduler/billingScheduler.routes");
const paymentRoutes = require("./modules/financial/payment/payment.routes");
const reconciliationRoutes = require("./modules/financial/reconciliation/reconciliation.routes");
const taxRoutes = require("./modules/financial/tax/tax.routes");
const societyBankAccountRoutes = require("./modules/financial/society-bank-account/societyBankAccount.routes");
const otherIncomeRoutes = require("./modules/financial/other-income/otherIncome.routes");
const accontingExportRoutes = require("./modules/financial/accounting-export/accountingExport.routes");
const staffRoutes = require("./modules/security/staff/staff.routes");   
const staffDocumentRoutes = require("./modules/security/staff-document/staffDocument.routes");
const staffUnitRoutes = require("./modules/security/staff-unit/staffUnit.routes");  
const staffAttendanceRoutes = require("./modules/security/staff-attendance/staffAttendance.routes");
const shiftRoutes = require("./modules/security/shift-roster/shift.routes");
const rosterRoutes = require("./modules/security/shift-roster/roster.routes");
const staffTaskRoutes = require("./modules/security/staff-task/staffTask.routes");
const checkpointRoutes = require("./modules/security/patrol/checkpoint.routes");
const patrolRoutes = require("./modules/security/patrol/patrol.routes");
const incidentRoutes = require("./modules/security/incident/incident.routes");
const emergencyRoutes = require("./modules/security/emergency/emergency.routes");
const securityAuditRoutes = require("./modules/security/audit/securityAudit.routes");
const assetRoutes = require("./modules/assets/asset/asset.routes");
const assetCategoryRoutes = require("./modules/assets/asset-category/assetCategory.routes");
const assetQrRoutes = require("./modules/assets/asset-qr/assetQr.routes");
const assetDocumentRoutes = require("./modules/assets/asset-document/assetDocument.routes");
const assetMaintenanceRoutes = require("./modules/assets/asset-maintenance/assetMaintenance.routes");
const inventoryRoutes = require("./modules/assets/inventory/inventory.routes");
const stockTransactionRoutes = require("./modules/assets/stock-transaction/stockTransaction.routes");
const amcRoutes = require("./modules/assets/amc/amc.routes");
const workOrderRoutes = require("./modules/assets/preventive-maintenance/workOrder.routes");
const maintenanceScheduleRoutes = require("./modules/assets/preventive-maintenance/maintenanceSchedule.routes");    
const assetLifecycleRoutes = require("./modules/assets/asset-lifecycle/assetLifecycle.routes"); 
const notificationTemplateRoutes = require("./modules/notifications/notification-template/notificationTemplate.routes"); 
const notificationPreferenceRoutes = require("./modules/notifications/notification-preference/notificationPreference.routes");
const notificationRoutes = require("./modules/notifications/notification/notification.routes");
const broadcastRoutes = require("./modules/notifications/broadcast/broadcast.routes");
const noticeRoutes = require("./modules/notices/notices.routes");
const communityGroupRoutes = require("./modules/community/group/group.routes");
const communityGroupMemberRoutes = require("./modules/community/group/groupMember.routes");
const communityForumRoutes = require("./modules/community/forum/forum.routes"); 
const communityPostRoutes = require("./modules/community/forum/post.routes"); 
const communityCommentRoutes = require("./modules/community/forum/comment.routes"); 
const moderationRoutes = require("./modules/community/moderation/moderation.routes");
const classifiedRoutes = require("./modules/community/classified/classified.routes");
const eventRoutes = require("./modules/community/event/event.routes");
const eventRsvpRoutes = require("./modules/community/event/eventRsvp.routes");
const meetingRoutes = require("./modules/community/meeting/meeting.routes");
const meetingAgendaRoutes = require("./modules/community/meeting/meetingAgenda.routes");
const meetingAttendanceRoutes = require("./modules/community/meeting/meetingAttendance.routes");
const meetingMinutesRoutes = require("./modules/community/meeting/meetingMinutes.routes");
const meetingActionItemRoutes = require("./modules/community/meeting/meetingActionItem.routes");
const governanceMeetingRoutes = require("./modules/community/governance/governanceMeeting.routes");
const votingRoutes = require("./modules/community/voting/voting.routes");
const dashboardRoutes = require("./modules/reports/dashboard/dashboard.routes");
const financeReportRoutes = require("./modules/reports/finance/financeReport.routes");
const operationsReportRoutes = require("./modules/reports/operations/operationsReport.routes");
const securityReportRoutes = require("./modules/reports/security/securityReport.routes");
const approvalReportRoutes = require("./modules/reports/approvals/approvalReport.routes");
const organizationRoutes = require("./modules/multi-society/organization/organization.routes");
const clusterRoutes = require("./modules/multi-society/cluster/cluster.routes");
const societyManagementRoutes = require("./modules/multi-society/society-management/societyManagement.routes");
const clusterDashboardRoutes = require("./modules/multi-society/cluster-dashboard/clusterDashboard.routes");
const societyAccessRoutes = require("./modules/multi-society/society-access/societyAccess.routes");
const clusterReportRoutes = require("./modules/multi-society/cluster-report/clusterReport.routes");
const multiSocietyRoutes = require("./modules/multi-society/multi-society/multiSociety.routes");
const residentRoutes = require("./modules/residents/resident/resident.routes");
const ownerUnitRoutes = require("./modules/residents/owner-unit/ownerUnit.routes");
const kycDocumentRoutes = require("./modules/residents/kyc-document/kycDocument.routes");
const residentKycRoutes = require("./modules/residents/resident-kyc/residentKyc.routes");
const residentVerificationRoutes = require( "./modules/residents/resident-verification/residentVerification.routes");
const nonMemberRoutes = require("./modules/residents/non-member/nonMember.routes");

app.use("/api/societies", societyRoutes);
app.use("/api/society-emergency-contacts", societyEmergencyContactRoutes);
app.use("/api/society-management-committee", societyCommitteeRoutes);
app.use("/api/towers", towerRoutes);
app.use("/api/floors", floorRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/society-settings", societySettingsRoutes);
app.use("/api/move-ins", moveInRoutes);
app.use("/api/move-outs", moveOutRoutes);   
app.use("/api/occupancies", occupancyRoutes);
app.use("/api/lifecycle-approvals", lifecycleApprovalRoutes);
app.use("/api/lifecycle-documents", lifecycleDocumentRoutes);
app.use("/api/gate-passes", gatePassRoutes);    
app.use("/api/access", accessAssignmentRoutes);
app.use("/api/billing-responsibilities", billingResponsibilityRoutes);
app.use("/api/financial-clearances", financialClearanceRoutes); 
app.use("/api/lifecycle-audits", lifecycleAuditRoutes);
app.use("/api/agreements", agreementRoutes);
app.use("/api/agreement-renewals", agreementRenewalRoutes);
app.use("/api/agreement-reminders", agreementReminderRoutes);
app.use("/api/agreement-notifications", agreementNotificationRoutes);
app.use("/api/accounts", accountRoutes);   
app.use("/api/accounting-periods",accountingPeriodRoutes);
app.use("/api/journals",journalRoutes);
app.use("/api/ledger-accounts",ledgerAccountRoutes);
app.use("/api/general-ledgers",generalLedgerRoutes);
app.use("/api/trial-balances",trialBalanceRoutes);
app.use("/api/financial-reports",financialReportRoutes);
app.use("/api/billings", billingRoutes);
app.use("/api/billing-configs", billingConfigRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/billing-scheduler", billingScheduleRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reconciliations", reconciliationRoutes);
app.use("/api/taxes", taxRoutes);
app.use("/api/society-bank-accounts", societyBankAccountRoutes);
app.use("/api/other-incomes", otherIncomeRoutes);
app.use("/api/accounting-exports", accontingExportRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/staff-documents", staffDocumentRoutes);
app.use("/api/staff-unit-assignments", staffUnitRoutes);
app.use("/api/staff-attendance", staffAttendanceRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/rosters", rosterRoutes);
app.use("/api/staff-tasks", staffTaskRoutes);
app.use("/api/checkpoints", checkpointRoutes);
app.use("/api/patrols", patrolRoutes); 
app.use("/api/incidents", incidentRoutes);
app.use("/api/emergencies", emergencyRoutes);
app.use("/api/security-audits", securityAuditRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/asset-categories", assetCategoryRoutes);
app.use("/api/asset-qr", assetQrRoutes);
app.use("/api/asset-documents", assetDocumentRoutes);
app.use("/api/asset-maintenance", assetMaintenanceRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/stock-transactions", stockTransactionRoutes);
app.use("/api/amcs", amcRoutes);
app.use("/api/work-orders", workOrderRoutes);   
app.use("/api/maintenance-schedules", maintenanceScheduleRoutes);   
app.use("/api/asset-lifecycle", assetLifecycleRoutes);
app.use("/api/notification-templates", notificationTemplateRoutes);
app.use("/api/notification-preferences", notificationPreferenceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/broadcasts", broadcastRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/community-groups",communityGroupRoutes);
app.use("/api/community-groups",communityGroupMemberRoutes);     
app.use( "/api/community-forums", communityForumRoutes ); 
app.use( "/api/community-posts", communityPostRoutes ); 
app.use( "/api/community", communityCommentRoutes);
app.use("/api/community-moderation",moderationRoutes);
app.use("/api/community-classifieds",classifiedRoutes);
app.use("/api/community-events",eventRsvpRoutes);
app.use("/api/community-events",eventRoutes);
app.use("/api/community-meetings",meetingRoutes);
app.use("/api/community-meeting-agendas",meetingAgendaRoutes);
app.use("/api/community-meeting-attendance", meetingAttendanceRoutes);
app.use("/api/community-meeting-minutes", meetingMinutesRoutes);
app.use("/api/community-meeting-action-items",meetingActionItemRoutes);
app.use( "/api/community-governance", governanceMeetingRoutes);
app.use("/api/community-voting",votingRoutes);
app.use("/api/reports/dashboard",dashboardRoutes);
app.use("/api/reports/finance",financeReportRoutes);
app.use("/api/reports/operations", operationsReportRoutes);
app.use("/api/reports/security",securityReportRoutes);
app.use("/api/reports/approvals",approvalReportRoutes);
app.use("/api/organizations",organizationRoutes);
app.use("/api/clusters",clusterRoutes);
app.use("/api/society-management",societyManagementRoutes);
app.use("/api/cluster-dashboard",clusterDashboardRoutes);
app.use("/api/society-access",societyAccessRoutes);
app.use("/api/cluster-reports",clusterReportRoutes);
app.use("/api/multi-society",multiSocietyRoutes);
app.use("/api/residents",residentRoutes);
app.use("/api/owner-units",ownerUnitRoutes);
app.use("/api/kyc-documents",kycDocumentRoutes);
app.use("/api/resident-kyc",residentKycRoutes);
app.use("/api/resident-verifications",residentVerificationRoutes);
app.use("/api/non-members",nonMemberRoutes);

// The former Sujal service is now mounted into the shared Express server.
// Keep its established /api/v1 paths while the existing API remains under /api.
app.use("/api/v1", sujalApiRoutes);

app.get("/health", async (req, res, next) => {
    try {
        await Promise.all([pool.query("SELECT 1"), sequelize.authenticate()]);
        res.json({ status: "ok", requestId: req.id, database: "connected" });
    } catch (error) {
        next(error);
    }
});

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Housing Society Backend API is running"
    });
});

app.post("/test", (req, res) => {
    res.json({
        success: true,
        message: "POST is working"
    });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
