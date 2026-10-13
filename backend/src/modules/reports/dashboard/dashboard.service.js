
const { Op } = require("sequelize");

const Society =
    require("../../../modules/societies/society/society.model");

const Unit =
    require("../../../modules/societies/unit/unit.model");

const Asset =
    require("../../../modules/assets/asset/asset.model");

const Notification =
    require("../../../modules/notifications/notification/notification.model");

const CommunityMeeting =
    require("../../../modules/community/meeting/meeting.model");

const operationsReportService =
    require("../operations/operationsReport.service");

const {
    validateDashboardRequest,
    validateDateRange
} = require("./dashboard.validation");


// ============================================================
// EXECUTIVE DASHBOARD
// ============================================================

const getExecutiveDashboard = async (data) => {

    validateDashboardRequest(data);
    validateDateRange(data);

    const societyId =
        data.societyId;


    // --------------------------------------------------------
    // CHECK SOCIETY
    // --------------------------------------------------------

    const society =
        await Society.findByPk(
            societyId
        );

    if (!society) {
        throw new Error(
            "Society not found"
        );
    }


    // --------------------------------------------------------
    // UNIT / OCCUPANCY
    // --------------------------------------------------------

    const totalUnits =
        await Unit.count({
            include: [
                {
                    association: "floor",
                    required: true,
                    include: [
                        {
                            association: "tower",
                            required: true,
                            where: {
                                societyId
                            }
                        }
                    ]
                }
            ]
        });


    const occupiedUnits =
        await Unit.count({
            where: {
                status: "OCCUPIED"
            },
            include: [
                {
                    association: "floor",
                    required: true,
                    include: [
                        {
                            association: "tower",
                            required: true,
                            where: {
                                societyId
                            }
                        }
                    ]
                }
            ]
        });


    const vacantUnits =
        await Unit.count({
            where: {
                status: "VACANT"
            },
            include: [
                {
                    association: "floor",
                    required: true,
                    include: [
                        {
                            association: "tower",
                            required: true,
                            where: {
                                societyId
                            }
                        }
                    ]
                }
            ]
        });


    // --------------------------------------------------------
    // ASSETS
    // --------------------------------------------------------

    const totalAssets =
        await Asset.count({
            where: {
                societyId
            }
        });


    // --------------------------------------------------------
    // NOTIFICATIONS
    // --------------------------------------------------------

    const pendingNotifications =
        await Notification.count({
            where: {
                societyId,
                status: "PENDING"
            }
        });


    const failedNotifications =
        await Notification.count({
            where: {
                societyId,
                status: "FAILED"
            }
        });


    // --------------------------------------------------------
    // COMMUNITY MEETINGS
    // --------------------------------------------------------

    const upcomingMeetings =
        await CommunityMeeting.count({
            where: {
                societyId,
                status: {
                    [Op.in]: [
                        "SCHEDULED",
                        "IN_PROGRESS"
                    ]
                }
            }
        });

    const residentReport =
        await operationsReportService.getResidentReport({ societyId });


    // --------------------------------------------------------
    // RETURN DASHBOARD
    // --------------------------------------------------------

    return {

        generatedAt:
            new Date(),

        society: {
            id: society.id,
            name: society.name,
            currency:
                society.currency || "INR"
        },

        finance: {
            bankBalance: null,
            collection: null,
            arrears: null,
            income: null,
            expense: null,
            netIncome: null
        },

        occupancy: {
            totalUnits,
            occupiedUnits,
            vacantUnits,
            occupancyPercentage:
                totalUnits > 0
                    ? Number(
                        (
                            occupiedUnits /
                            totalUnits
                        ) * 100
                    ).toFixed(2)
                    : 0
        },

        residents: residentReport,

        vehicles: {
            totalVehicles: null,
            activeVehicles: null
        },

        parking: {
            totalSlots: null,
            occupiedSlots: null,
            vacantSlots: null
        },

        security: {
            visitorsToday: null,
            gateEntriesToday: null,
            staffPresentToday: null,
            patrolsToday: null
        },

        workflow: {
            pendingApprovals: null,
            slaBreaches: null,
            pendingPayments: null
        },

        assets: {
            totalAssets
        },

        community: {
            upcomingMeetings
        },

        system: {
            pendingNotifications,
            failedNotifications
        }
    };
};


module.exports = {
    getExecutiveDashboard
};

