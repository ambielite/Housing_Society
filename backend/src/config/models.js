const Society =
    require("../modules/societies/society/society.model");

const Tower =
    require("../modules/societies/tower/tower.model");

const Floor =
    require("../modules/societies/floor/floor.model");

const Unit =
    require("../modules/societies/unit/unit.model");

const SocietySettings =
    require("../modules/societies/society-settings/society-settings.model");    
const SocietyEmergencyContact =
    require("../modules/societies/emergency-contact/societyEmergencyContact.model");

const MoveIn =
    require("../modules/move-InOut/move-in/moveIn.model"); 
    
const MoveOut =
    require("../modules/move-InOut/move-out/moveOut.model"); 
    
const Occupancy =
    require("../modules/move-InOut/occupancy/occupancy.model");

const LifecycleApproval =
    require("../modules/move-InOut/lifecycle-approval/lifecycleApproval.model");  

const LifecycleDocument =
    require("../modules/move-InOut/lifecycle-document/lifecycleDocument.model");

const GatePass =
    require("../modules/move-InOut/gate-pass/gatePass.model");  
  
const AccessAssignment =
    require("../modules/move-InOut/access/accessAssignment.model");

const BillingResponsibility =
    require("../modules/move-InOut/billing-responsibility/billingResponsibility.model");

    const FinancialClearance =
    require("../modules/move-InOut/financial-clearance/financialClearance.model");  
 
const lifecycleAudit =
    require("../modules/move-InOut/lifecycle-audit/lifecycleAudit.model");  

const Agreement = require("../modules/move-InOut/agreement/agreement.model"); 
const AgreementRenewal = require("../modules/move-InOut/agreement-renewal/agreementRenewal.model");
const AgreementReminderConfig = require("../modules/move-InOut/agreement-reminder/agreementReminderConfig.model");
const AgreementReminder = require("../modules/move-InOut/agreement-reminder/agreementReminder.model");  
const AgreementNotification = require("../modules/move-InOut/agreement-notification/agreementNotification.model");
const Account = require("../modules/financial/account/account.model");
const AccountingPeriod = require("../modules/financial/accounting-period/accountingPeriod.model");
const Journal = require("../modules/financial/journal/journal.model");
const JournalLine = require("../modules/financial/journal/journalLine.model");
const LedgerAccount = require("../modules/financial/ledger-account/ledgerAccount.model");
const billing = require("../modules/financial/billing/billing.model");
const billingConfig = require("../modules/financial/billing-config/billingConfig.model");
const invoice = require("../modules/financial/invoice/invoice.model");
const invoiceItem = require("../modules/financial/invoice/invoiceItem.model");
const Payment = require("../modules/financial/payment/payment.model");
const Reconciliation = require("../modules/financial/reconciliation/reconciliation.model");
const tax = require("../modules/financial/tax/tax.model");
const Staff = require("../modules/security/staff/staff.model");
const StaffDocument = require("../modules/security/staff-document/staffDocument.model");    
const StaffUnit = require("../modules/security/staff-unit/staffUnit.model");
const StaffAttendance = require("../modules/security/staff-attendance/staffAttendance.model");
const shift = require("../modules/security/shift-roster/shift.model");
const roster = require("../modules/security/shift-roster/roster.model");
const StaffTask = require("../modules/security/staff-task/staffTask.model");
const Checkpoint = require("../modules/security/patrol/checkpoint.model");
const PatrolCheckpoint = require("../modules/security/patrol/patrolCheckpoint.model");
const Patrol = require("../modules/security/patrol/patrol.model");
const Incident = require("../modules/security/incident/incident.model");
const Emergency = require("../modules/security/emergency/emergency.model");
const SecurityAudit = require("../modules/security/audit/securityAudit.model");
const Asset = require("../modules/assets/asset/asset.model");
const AssetCategory = require("../modules/assets/asset-category/assetCategory.model");
const AssetQr = require("../modules/assets/asset-qr/assetQr.model");
const AssetDocument = require("../modules/assets/asset-document/assetDocument.model");  
const AssetMaintenance = require("../modules/assets/asset-maintenance/assetMaintenance.model"); 
const Inventory = require("../modules/assets/inventory/inventory.model");
const StockTransaction = require("../modules/assets/stock-transaction/stockTransaction.model");
const Vendor = require("../modules/assets/vendor/vendor.model");
const AMC = require("../modules/assets/amc/amc.model");
const WorkOrder = require("../modules/assets/preventive-maintenance/workOrder.model");
const MaintenanceSchedule = require("../modules/assets/preventive-maintenance/maintenanceSchedule.model");
const AssetLifecycle = require("../modules/assets/asset-lifecycle/assetLifecycle.model");   
const NotificationTemplate = require("../modules/notifications/notification-template/notificationTemplate.model");
const NotificationPreference = require("../modules/notifications/notification-preference/notificationPreference.model");
const Notification = require("../modules/notifications/notification/notification.model");
const Broadcast = require("../modules/notifications/broadcast/broadcast.model");
const CommunityGroupMember = require("../modules/community/group/groupMember.model");
const CommunityGroup = require("../modules/community/group/group.model");
const CommunityForum = require("../modules/community/forum/forum.model");
const CommunityPost = require("../modules/community/forum/post.model");
const CommunityComment = require("../modules/community/forum/comment.model");
const CommunityModeration = require( "../modules/community/moderation/moderation.model" ); 
const CommunityClassified = require("../modules/community/classified/classified.model"); 
const CommunityEvent = require("../modules/community/event/event.model");
const CommunityEventRsvp = require("../modules/community/event/eventRsvp.model");
const CommunityMeeting = require("../modules/community/meeting/meeting.model");
const CommunityMeetingAgenda = require("../modules/community/meeting/meetingAgenda.model");
const CommunityMeetingAttendance = require("../modules/community/meeting/meetingAttendance.model");
const CommunityMeetingMinutes = require("../modules/community/meeting/meetingMinutes.model");
const CommunityMeetingActionItem = require("../modules/community/meeting/meetingActionItem.model");
const CommunityGovernanceMeeting = require("../modules/community/governance/governanceMeeting.model");
const CommunityVoting = require("../modules/community/voting/voting.model");
const CommunityVotingOption = require("../modules/community/voting/votingOption.model");
const CommunityVotingEligibility =  require("../modules/community/voting/votingEligibility.model");
const CommunityVotingBallot =  require("../modules/community/voting/votingBallot.model");
const CommunityVotingVote =  require("../modules/community/voting/votingVote.model");
const CommunityGovernanceRule = require("../modules/community/voting/governanceRule.model");
const CommunityVotingOtp = require("../modules/community/voting/votingOtp.model");
const CommunityVotingAudit = require("../modules/community/voting/votingAudit.model");
const Organization = require("../modules/multi-society/organization/organization.model");
const Cluster = require("../modules/multi-society/cluster/cluster.model");
const MultiSocietyAccess = require("../modules/multi-society/multi-society/multiSociety.model");
const Resident = require("../modules/residents/resident/resident.model");
const OwnerUnit = require("../modules/residents/owner-unit/ownerUnit.model");
const KycDocument = require("../modules/residents/kyc-document/kycDocument.model");

/*
    Society → Tower
*/
Society.hasMany(Tower, {
    foreignKey: "societyId",
    as: "towers"
});

Society.hasMany(SocietyEmergencyContact, {
    foreignKey: "societyId",
    as: "emergencyContacts",
    onDelete: "CASCADE"
});

SocietyEmergencyContact.belongsTo(Society, {
    foreignKey: "societyId",
    as: "society"
});

Tower.belongsTo(Society, {
    foreignKey: "societyId",
    as: "society"
});


/*
    Tower → Floor
*/
Tower.hasMany(Floor, {
    foreignKey: "towerId",
    as: "floors"
});

Floor.belongsTo(Tower, {
    foreignKey: "towerId",
    as: "tower"
});


/*
    Floor → Unit
*/
Floor.hasMany(Unit, {
    foreignKey: "floorId",
    as: "units"
});

Unit.belongsTo(Floor, {
    foreignKey: "floorId",
    as: "floor"
});

/*
    Society → Society Settings
*/

Society.hasOne(SocietySettings, {
    foreignKey: "societyId",
    as: "settings",
    onDelete: "CASCADE"
});

SocietySettings.belongsTo(Society, {
    foreignKey: "societyId",
    as: "society"
});

Journal.hasMany(JournalLine, {
    foreignKey: "journalId",
    as: "lines",
    onDelete: "CASCADE"
});

JournalLine.belongsTo(Journal, {
    foreignKey: "journalId",
    as: "journal"
});

JournalLine.belongsTo(Account, {
    foreignKey: "accountId",
    as: "account"
});

invoice.hasMany(invoiceItem, {
    foreignKey: "invoiceId",
    as: "items",
    onDelete: "CASCADE"
});

invoiceItem.belongsTo(invoice, {
    foreignKey: "invoiceId",
    as: "invoice"
});

Staff.hasMany(StaffDocument, {
    foreignKey: "staffId",
    as: "documents",
    onDelete: "CASCADE"
});

StaffDocument.belongsTo(Staff, {
    foreignKey: "staffId",
    as: "staff"
});

Staff.hasMany(StaffUnit, {
    foreignKey: "staffId",
    as: "unitAssignments",
    onDelete: "CASCADE"
});

StaffUnit.belongsTo(Staff, {
    foreignKey: "staffId",
    as: "staff"
});


Unit.hasMany(StaffUnit, {
    foreignKey: "unitId",
    as: "staffAssignments",
    onDelete: "CASCADE"
});

StaffUnit.belongsTo(Unit, {
    foreignKey: "unitId",
    as: "unit"
});

Staff.hasMany(StaffAttendance, {
    foreignKey: "staffId",
    as: "attendance",
    onDelete: "CASCADE"
});

StaffAttendance.belongsTo(Staff, {
    foreignKey: "staffId",
    as: "staff"
});

Society.hasMany(shift, {
    foreignKey: "societyId",
    as: "shifts",
    onDelete: "CASCADE"
});

shift.belongsTo(Society, {
    foreignKey: "societyId",
    as: "society"
});


Society.hasMany(roster, {
    foreignKey: "societyId",
    as: "rosters",
    onDelete: "CASCADE"
});

roster.belongsTo(Society, {
    foreignKey: "societyId",
    as: "society"
});


Staff.hasMany(roster, {
    foreignKey: "staffId",
    as: "rosters",
    onDelete: "CASCADE"
});

roster.belongsTo(Staff, {
    foreignKey: "staffId",
    as: "staff"
});


shift.hasMany(roster, {
    foreignKey: "shiftId",
    as: "rosters",
    onDelete: "CASCADE"
});

roster.belongsTo(shift, {
    foreignKey: "shiftId",
    as: "shift"
});

Society.hasMany(StaffTask, {
    foreignKey: "societyId",
    as: "staffTasks",
    onDelete: "CASCADE"
});

StaffTask.belongsTo(Society, {
    foreignKey: "societyId",
    as: "society"
});


Staff.hasMany(StaffTask, {
    foreignKey: "staffId",
    as: "tasks",
    onDelete: "CASCADE"
});

StaffTask.belongsTo(Staff, {
    foreignKey: "staffId",
    as: "staff"
});

Society.hasMany(Checkpoint, {
    foreignKey: "societyId",
    as: "checkpoints",
    onDelete: "CASCADE"
});

Checkpoint.belongsTo(Society, {
    foreignKey: "societyId",
    as: "society"
});


Society.hasMany(Patrol, {
    foreignKey: "societyId",
    as: "patrols",
    onDelete: "CASCADE"
});

Patrol.belongsTo(Society, {
    foreignKey: "societyId",
    as: "society"
});


Staff.hasMany(Patrol, {
    foreignKey: "staffId",
    as: "patrols",
    onDelete: "CASCADE"
});

Patrol.belongsTo(Staff, {
    foreignKey: "staffId",
    as: "staff"
});


Patrol.hasMany(PatrolCheckpoint, {
    foreignKey: "patrolId",
    as: "checkpoints",
    onDelete: "CASCADE"
});

PatrolCheckpoint.belongsTo(Patrol, {
    foreignKey: "patrolId",
    as: "patrol"
});


Checkpoint.hasMany(PatrolCheckpoint, {
    foreignKey: "checkpointId",
    as: "patrolVisits",
    onDelete: "CASCADE"
});

PatrolCheckpoint.belongsTo(Checkpoint, {
    foreignKey: "checkpointId",
    as: "checkpoint"
});

Society.hasMany(Incident, {
    foreignKey: "societyId",
    as: "incidents",
    onDelete: "CASCADE"
});

Incident.belongsTo(Society, {
    foreignKey: "societyId",
    as: "society"
});


Staff.hasMany(Incident, {
    foreignKey: "assignedTo",
    as: "assignedIncidents",
    onDelete: "SET NULL"
});

Incident.belongsTo(Staff, {
    foreignKey: "assignedTo",
    as: "assignedStaff"
});

Unit.hasMany(Incident, {
    foreignKey: "unitId",
    as: "incidents",
    onDelete: "SET NULL"
});

Incident.belongsTo(Unit, {
    foreignKey: "unitId",
    as: "unit"
});

Society.hasMany(Emergency, {
    foreignKey: "societyId",
    as: "emergencies",
    onDelete: "CASCADE"
});

Emergency.belongsTo(Society, {
    foreignKey: "societyId",
    as: "society"
});

Staff.hasMany(Emergency, {
    foreignKey: "reportedBy",
    as: "reportedEmergencies",
    onDelete: "SET NULL"
});

Emergency.belongsTo(Staff, {
    foreignKey: "reportedBy",
    as: "reportingStaff"
});

Staff.hasMany(Emergency, {
    foreignKey: "assignedTo",
    as: "assignedEmergencies",
    onDelete: "SET NULL"
});

Emergency.belongsTo(Staff, {
    foreignKey: "assignedTo",
    as: "assignedStaff"
});

Unit.hasMany(Emergency, {
    foreignKey: "unitId",
    as: "emergencies",
    onDelete: "SET NULL"
});

Emergency.belongsTo(Unit, {
    foreignKey: "unitId",
    as: "unit"
});

Society.hasMany(SecurityAudit, {
    foreignKey: "societyId",
    as: "securityAudits",
    onDelete: "CASCADE"
});

SecurityAudit.belongsTo(Society, {
    foreignKey: "societyId",
    as: "society"
});
Staff.hasMany(SecurityAudit, {
    foreignKey: "userId",
    as: "securityAuditRecords",
    onDelete: "SET NULL"
});

SecurityAudit.belongsTo(Staff, {
    foreignKey: "userId",
    as: "user"
});

Society.hasMany(Asset, {
    foreignKey: "societyId",
    as: "assets",
    onDelete: "CASCADE"
});

Asset.belongsTo(Society, {
    foreignKey: "societyId",
    as: "society"
});

Tower.hasMany(Asset, {
    foreignKey: "towerId",
    as: "assets",
    onDelete: "SET NULL"
});

Asset.belongsTo(Tower, {
    foreignKey: "towerId",
    as: "tower"
});

Floor.hasMany(Asset, {
    foreignKey: "floorId",
    as: "assets",
    onDelete: "SET NULL"
});

Asset.belongsTo(Floor, {
    foreignKey: "floorId",
    as: "floor"
});

Unit.hasMany(Asset, {
    foreignKey: "unitId",
    as: "assets",
    onDelete: "SET NULL"
});

Asset.belongsTo(Unit, {
    foreignKey: "unitId",
    as: "unit"
});

Society.hasMany(AssetCategory, {
    foreignKey: "societyId",
    as: "assetCategories",
    onDelete: "CASCADE"
});

AssetCategory.belongsTo(Society, {
    foreignKey: "societyId",
    as: "society"
});

AssetCategory.hasMany(Asset, {
    foreignKey: "categoryId",
    as: "assets",
    onDelete: "SET NULL"
});

Asset.belongsTo(AssetCategory, {
    foreignKey: "categoryId",
    as: "category"
});


Asset.hasOne(AssetQr, {
    foreignKey: "assetId",
    as: "qrTag",
    onDelete: "CASCADE"
});

AssetQr.belongsTo(Asset, {
    foreignKey: "assetId",
    as: "asset"
});


Asset.hasMany(AssetDocument, {
    foreignKey: "assetId",
    as: "documents",
    onDelete: "CASCADE"
});

AssetDocument.belongsTo(Asset, {
    foreignKey: "assetId",
    as: "asset"
});


Asset.hasMany(AssetMaintenance, {
    foreignKey: "assetId",
    as: "maintenanceHistory",
    onDelete: "CASCADE"
});

AssetMaintenance.belongsTo(Asset, {
    foreignKey: "assetId",
    as: "asset"
});

Society.hasMany(Inventory, {
    foreignKey: "societyId",
    as: "inventoryItems",
    onDelete: "CASCADE"
});

Inventory.belongsTo(Society, {
    foreignKey: "societyId",
    as: "society"
});


Inventory.hasMany(StockTransaction, {
    foreignKey: "inventoryId",
    as: "stockTransactions",
    onDelete: "RESTRICT"
});

StockTransaction.belongsTo(Inventory, {
    foreignKey: "inventoryId",
    as: "inventory"
});

Society.hasMany(Vendor, {
    foreignKey: "societyId",
    as: "vendors",
    onDelete: "CASCADE"
});

Vendor.belongsTo(Society, {
    foreignKey: "societyId",
    as: "society"
});

Vendor.hasMany(AMC, {
    foreignKey: "vendorId",
    as: "amcs",
    onDelete: "RESTRICT"
});

AMC.belongsTo(Vendor, {
    foreignKey: "vendorId",
    as: "vendor"
});

AMC.belongsTo(AMC, {
    foreignKey: "parentAmcId",
    as: "parentAmc"
});

AMC.hasMany(AMC, {
    foreignKey: "parentAmcId",
    as: "renewals"
});

Vendor.hasMany(Asset, {
    foreignKey: "vendorId",
    as: "assets",
    onDelete: "SET NULL"
});

Asset.belongsTo(Vendor, {
    foreignKey: "vendorId",
    as: "vendor"
});

Asset.hasMany(MaintenanceSchedule, {
    foreignKey: "assetId",
    as: "maintenanceSchedules",
    onDelete: "CASCADE"
});

MaintenanceSchedule.belongsTo(Asset, {
    foreignKey: "assetId",
    as: "asset"
});


AMC.hasMany(MaintenanceSchedule, {
    foreignKey: "amcId",
    as: "maintenanceSchedules",
    onDelete: "SET NULL"
});

MaintenanceSchedule.belongsTo(AMC, {
    foreignKey: "amcId",
    as: "amc"
});


Vendor.hasMany(MaintenanceSchedule, {
    foreignKey: "vendorId",
    as: "maintenanceSchedules",
    onDelete: "SET NULL"
});

MaintenanceSchedule.belongsTo(Vendor, {
    foreignKey: "vendorId",
    as: "vendor"
});

MaintenanceSchedule.hasMany(WorkOrder, {
    foreignKey: "scheduleId",
    as: "workOrders",
    onDelete: "SET NULL"
});

WorkOrder.belongsTo(MaintenanceSchedule, {
    foreignKey: "scheduleId",
    as: "schedule"
});


Asset.hasMany(WorkOrder, {
    foreignKey: "assetId",
    as: "workOrders",
    onDelete: "CASCADE"
});

WorkOrder.belongsTo(Asset, {
    foreignKey: "assetId",
    as: "asset"
});


AMC.hasMany(WorkOrder, {
    foreignKey: "amcId",
    as: "workOrders",
    onDelete: "SET NULL"
});

WorkOrder.belongsTo(AMC, {
    foreignKey: "amcId",
    as: "amc"
});


Vendor.hasMany(WorkOrder, {
    foreignKey: "vendorId",
    as: "workOrders",
    onDelete: "SET NULL"
});

WorkOrder.belongsTo(Vendor, {
    foreignKey: "vendorId",
    as: "vendor"
});

Asset.hasMany(AssetLifecycle, {
    foreignKey: "assetId",
    as: "lifecycleRecords",
    onDelete: "CASCADE"
});

AssetLifecycle.belongsTo(Asset, {
    foreignKey: "assetId",
    as: "asset"
});


Society.hasMany(AssetLifecycle, {
    foreignKey: "societyId",
    as: "assetLifecycleRecords",
    onDelete: "CASCADE"
});

AssetLifecycle.belongsTo(Society, {
    foreignKey: "societyId",
    as: "society"
});

Society.hasMany(NotificationPreference, {
    foreignKey: "societyId",
    as: "notificationPreferences",
    onDelete: "CASCADE"
});

NotificationPreference.belongsTo(Society, {
    foreignKey: "societyId",
    as: "society"
});

Society.hasMany(Notification, {
    foreignKey: "societyId",
    as: "notifications",
    onDelete: "CASCADE"
});

Notification.belongsTo(Society, {
    foreignKey: "societyId",
    as: "society"
});

NotificationTemplate.hasMany(Notification, {
    foreignKey: "templateId",
    as: "notifications",
    onDelete: "SET NULL"
});

Notification.belongsTo(NotificationTemplate, {
    foreignKey: "templateId",
    as: "template"
});

Society.hasMany(Broadcast, {
    foreignKey: "societyId",
    as: "broadcasts",
    onDelete: "CASCADE"
});

Broadcast.belongsTo(Society, {
    foreignKey: "societyId",
    as: "society"
});

CommunityGroup.hasMany(CommunityGroupMember, {
    foreignKey: "groupId",
    as: "members",
    onDelete: "CASCADE"
});

CommunityGroupMember.belongsTo(CommunityGroup, {
    foreignKey: "groupId",
    as: "group"
});

Society.hasMany(CommunityGroup, {
    foreignKey: "societyId",
    as: "communityGroups"
});

CommunityGroup.belongsTo(Society, {
    foreignKey: "societyId",
    as: "society"
});

Society.hasMany(CommunityForum, {
    foreignKey: "societyId",
    as: "communityForums"
});

CommunityForum.belongsTo(Society, {
    foreignKey: "societyId",
    as: "society"
});


CommunityForum.hasMany(CommunityPost, {
    foreignKey: "forumId",
    as: "posts",
    onDelete: "CASCADE"
});

CommunityPost.belongsTo(CommunityForum, {
    foreignKey: "forumId",
    as: "forum"
});


CommunityPost.hasMany(CommunityComment, {
    foreignKey: "postId",
    as: "comments",
    onDelete: "CASCADE"
});

CommunityComment.belongsTo(CommunityPost, {
    foreignKey: "postId",
    as: "post"
});


CommunityComment.belongsTo(CommunityComment, {
    foreignKey: "parentCommentId",
    as: "parentComment"
});

CommunityComment.hasMany(CommunityComment, {
    foreignKey: "parentCommentId",
    as: "replies",
    onDelete: "CASCADE"
});

CommunityEvent.hasMany(
    CommunityEventRsvp,
    {
        foreignKey: "eventId",
        as: "rsvps",
        onDelete: "CASCADE"
    }
);

CommunityEventRsvp.belongsTo(
    CommunityEvent,
    {
        foreignKey: "eventId",
        as: "event"
    }
);

Society.hasMany(
    CommunityEvent,
    {
        foreignKey: "societyId",
        as: "communityEvents"
    }
);

CommunityEvent.belongsTo(
    Society,
    {
        foreignKey: "societyId",
        as: "society"
    }
);

Society.hasMany(
    CommunityEventRsvp,
    {
        foreignKey: "societyId",
        as: "communityEventRsvps"
    }
);

CommunityEventRsvp.belongsTo(
    Society,
    {
        foreignKey: "societyId",
        as: "society"
    }
);

CommunityMeeting.hasMany(
    CommunityMeetingAgenda,
    {
        foreignKey: "meetingId",
        as: "agendas",
        onDelete: "CASCADE"
    }
);

CommunityMeetingAgenda.belongsTo(
    CommunityMeeting,
    {
        foreignKey: "meetingId",
        as: "meeting"
    }
);

CommunityMeeting.hasOne(
    CommunityMeetingMinutes,
    {
        foreignKey: "meetingId",
        as: "minutes",
        onDelete: "CASCADE"
    }
);

CommunityMeetingMinutes.belongsTo(
    CommunityMeeting,
    {
        foreignKey: "meetingId",
        as: "meeting"
    }
);

CommunityMeeting.hasMany(
    CommunityMeetingActionItem,
    {
        foreignKey: "meetingId",
        as: "actionItems",
        onDelete: "CASCADE"
    }
);

CommunityMeetingActionItem.belongsTo(
    CommunityMeeting,
    {
        foreignKey: "meetingId",
        as: "meeting"
    }
);

CommunityMeetingAgenda.hasMany(
    CommunityMeetingActionItem,
    {
        foreignKey: "agendaId",
        as: "actionItems"
    }
);

CommunityMeetingActionItem.belongsTo(
    CommunityMeetingAgenda,
    {
        foreignKey: "agendaId",
        as: "agenda"
    }
);

CommunityMeeting.hasOne(
    CommunityGovernanceMeeting,
    {
        foreignKey: "meetingId",
        as: "governanceWorkflow",
        onDelete: "CASCADE"
    }
);

CommunityGovernanceMeeting.belongsTo(
    CommunityMeeting,
    {
        foreignKey: "meetingId",
        as: "meeting"
    }
);

Society.hasMany(
    CommunityGovernanceMeeting,
    {
        foreignKey: "societyId",
        as: "governanceMeetings",
        onDelete: "CASCADE"
    }
);

CommunityGovernanceMeeting.belongsTo(
    Society,
    {
        foreignKey: "societyId",
        as: "society"
    }
);

Society.hasMany(
    CommunityVoting,
    {
        foreignKey: "societyId",
        as: "communityVotings",
        onDelete: "CASCADE"
    }
);

CommunityVoting.belongsTo(
    Society,
    {
        foreignKey: "societyId",
        as: "society"
    }
);



CommunityGovernanceMeeting.hasMany(
    CommunityVoting,
    {
        foreignKey: "governanceMeetingId",
        as: "votings",
        onDelete: "CASCADE"
    }
);

CommunityVoting.belongsTo(
    CommunityGovernanceMeeting,
    {
        foreignKey: "governanceMeetingId",
        as: "governanceMeeting"
    }
);


CommunityMeeting.hasMany(
    CommunityVoting,
    {
        foreignKey: "meetingId",
        as: "votings",
        onDelete: "CASCADE"
    }
);

CommunityVoting.belongsTo(
    CommunityMeeting,
    {
        foreignKey: "meetingId",
        as: "meeting"
    }
);

CommunityVoting.hasMany(
    CommunityVotingOption,
    {
        foreignKey: "votingId",
        as: "options",
        onDelete: "CASCADE"
    }
);

CommunityVotingOption.belongsTo(
    CommunityVoting,
    {
        foreignKey: "votingId",
        as: "voting"
    }
);


CommunityVoting.hasMany(
    CommunityVotingEligibility,
    {
        foreignKey: "votingId",
        as: "eligibleVoters",
        onDelete: "CASCADE"
    }
);

CommunityVotingEligibility.belongsTo(
    CommunityVoting,
    {
        foreignKey: "votingId",
        as: "voting"
    }
);

CommunityVoting.hasMany(
    CommunityVotingBallot,
    {
        foreignKey: "votingId",
        as: "ballots",
        onDelete: "CASCADE"
    }
);

CommunityVotingBallot.belongsTo(
    CommunityVoting,
    {
        foreignKey: "votingId",
        as: "voting"
    }
);


CommunityVotingEligibility.hasMany(
    CommunityVotingBallot,
    {
        foreignKey: "eligibilityId",
        as: "ballots",
        onDelete: "CASCADE"
    }
);

CommunityVotingBallot.belongsTo(
    CommunityVotingEligibility,
    {
        foreignKey: "eligibilityId",
        as: "eligibility"
    }
);

CommunityVotingOption.hasMany(
    CommunityVotingVote,
    {
        foreignKey: "optionId",
        as: "votes",
        onDelete: "CASCADE"
    }
);

CommunityVotingVote.belongsTo(
    CommunityVotingOption,
    {
        foreignKey: "optionId",
        as: "option"
    }
);


CommunityVoting.hasMany(
    CommunityVotingVote,
    {
        foreignKey: "votingId",
        as: "votes",
        onDelete: "CASCADE"
    }
);

CommunityVotingVote.belongsTo(
    CommunityVoting,
    {
        foreignKey: "votingId",
        as: "voting"
    }
);

Society.hasMany(
    CommunityGovernanceRule,
    {
        foreignKey: "societyId",
        as: "governanceRules",
        onDelete: "CASCADE"
    }
);

CommunityGovernanceRule.belongsTo(
    Society,
    {
        foreignKey: "societyId",
        as: "society"
    }
);

Organization.hasMany(Cluster, {
    foreignKey: "organizationId",
    as: "clusters",
    onDelete: "RESTRICT",
    onUpdate: "CASCADE"
});


Cluster.belongsTo(Organization, {
    foreignKey: "organizationId",
    as: "organization"
});

Cluster.hasMany(Society, {
    foreignKey: "clusterId",
    as: "societies",
    onDelete: "RESTRICT",
    onUpdate: "CASCADE"
});

Society.belongsTo(Cluster, {
    foreignKey: "clusterId",
    as: "cluster"
});

Organization.hasMany(Society, {
    foreignKey: "organizationId",
    as: "societies",
    onDelete: "RESTRICT",
    onUpdate: "CASCADE"
});

Society.belongsTo(Organization, {
    foreignKey: "organizationId",
    as: "organization"
});

Society.hasMany(Resident, {
    foreignKey: "societyId",
    as: "residents",
    onDelete: "CASCADE"
});

Resident.belongsTo(Society, {
    foreignKey: "societyId",
    as: "society"
});


OwnerUnit.belongsTo(
    Society,
    {
        foreignKey: "societyId",
        as: "society"
    }
);

OwnerUnit.belongsTo(
    Unit,
    {
        foreignKey: "unitId",
        as: "unit"
    }
);

OwnerUnit.belongsTo(
    Resident,
    {
        foreignKey: "ownerId",
        as: "owner"
    }
);

Society.hasMany(
    OwnerUnit,
    {
        foreignKey: "societyId",
        as: "ownerUnitRelations"
    }
);

Unit.hasMany(
    OwnerUnit,
    {
        foreignKey: "unitId",
        as: "ownerRelations"
    }
);

Resident.hasMany(
    OwnerUnit,
    {
        foreignKey: "ownerId",
        as: "ownedUnits"
    }
);

Resident.hasMany(
    KycDocument,
    {
        foreignKey: "stakeholderId",
        as: "kycDocuments",
        onDelete: "CASCADE"
    }
);

KycDocument.belongsTo(
    Resident,
    {
        foreignKey: "stakeholderId",
        as: "stakeholder"
    }
);

module.exports = {
    Society,
    Tower,
    Floor,
    Unit,
    SocietySettings,
    SocietyEmergencyContact,
    
    MoveIn,
    MoveOut,
    Occupancy,
    LifecycleApproval,
    LifecycleDocument,
    GatePass,
    AccessAssignment,
    BillingResponsibility,
    FinancialClearance, 
    lifecycleAudit,
    Agreement,
    AgreementRenewal,   
    AgreementReminderConfig,
    AgreementReminder,
    AgreementNotification, 

    Account,
    AccountingPeriod,
    Journal,
    JournalLine,
    LedgerAccount,
    billing,
    billingConfig,
    invoice,
    invoiceItem,
    Payment,
    Reconciliation,
    tax,

    Staff,
    StaffDocument,  
    StaffUnit,
    StaffAttendance,
    shift,
    roster,
    StaffTask,
    Checkpoint,
    PatrolCheckpoint,
    Patrol,
    Incident,
    Emergency,
    SecurityAudit,

    Asset,
    AssetCategory,
    AssetQr,
    AssetDocument,
    AssetMaintenance,
    Inventory,
    StockTransaction,
    Vendor,
    AMC,
    WorkOrder,
    MaintenanceSchedule,
    AssetLifecycle,

    NotificationTemplate,
    NotificationPreference,
    Notification,
    Broadcast,

    CommunityGroup,
    CommunityGroupMember,
    CommunityForum,
    CommunityPost,
    CommunityComment,
    CommunityModeration,
    CommunityClassified,
    CommunityEvent,
    CommunityMeeting,
    CommunityMeetingAgenda,
    CommunityMeetingAttendance,
    CommunityMeetingMinutes,
    CommunityMeetingActionItem,
    CommunityGovernanceMeeting,
    CommunityVoting,
    CommunityVotingOption,
    CommunityVotingEligibility,
    CommunityVotingBallot,
    CommunityVotingVote,
    CommunityGovernanceRule,
    CommunityVotingOtp,
    CommunityVotingAudit,
    
    Organization,
    Cluster,
    MultiSocietyAccess,

    Resident,
    OwnerUnit,
    KycDocument   




};
