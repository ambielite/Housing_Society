const { Op, fn, col, literal } = require("sequelize");

const LifecycleApproval = require(
    "../../../modules/move-InOut/lifecycle-approval/lifecycleApproval.model"
);

const Payment = require(
    "../../../modules/financial/payment/payment.model"
);
const MoveIn = require(
    "../../../modules/move-InOut/move-in/moveIn.model"
);
const MoveOut = require(
    "../../../modules/move-InOut/move-out/moveOut.model"
);
const Unit = require(
    "../../../modules/societies/unit/unit.model"
);
const Resident = require(
    "../../../modules/residents/resident/resident.model"
);
const usersRepository = require(
    "../../users/users.repository"
);
const genericApprovalsRepository = require(
    "../../approvals/approvals.repository"
);


/*
|--------------------------------------------------------------------------
| Helper
|--------------------------------------------------------------------------
*/

const buildDateFilter = (fromDate, toDate) => {

    const filter = {};

    if (fromDate && toDate) {
        filter[Op.between] = [
            `${fromDate} 00:00:00`,
            `${toDate} 23:59:59`
        ];
    } else if (fromDate) {
        filter[Op.gte] = `${fromDate} 00:00:00`;
    } else if (toDate) {
        filter[Op.lte] = `${toDate} 23:59:59`;
    }

    return filter;
};

const getSocietyApprovalScope = async (societyId) => {
    const [moveIns, moveOuts] = await Promise.all([
        MoveIn.findAll({ where: { societyId }, attributes: ["id"], raw: true }),
        MoveOut.findAll({ where: { societyId }, attributes: ["id"], raw: true })
    ]);
    return {
        [Op.or]: [
            { lifecycleType: "MOVE_IN", lifecycleId: { [Op.in]: moveIns.map((row) => row.id) } },
            { lifecycleType: "MOVE_OUT", lifecycleId: { [Op.in]: moveOuts.map((row) => row.id) } }
        ]
    };
};

const listGenericApprovalRequests = async (societyId, fromDate, toDate) => {
    const requests = await genericApprovalsRepository.listRequests({ societyId });
    return requests.filter((request) => {
        const createdAt = request.created_at instanceof Date
            ? request.created_at.toISOString()
            : String(request.created_at || "");
        const day = createdAt.slice(0, 10);
        return (!fromDate || day >= fromDate) && (!toDate || day <= toDate);
    });
};

const formatGenericApproval = (request) => ({
    recordSource: "Workflow approval",
    entityType: request.entity_type,
    entity: request.entity_display_name || "Related record",
    approvalType: request.approval_type,
    status: request.status,
    currentLevel: request.current_level,
    createdAt: request.created_at,
    updatedAt: request.updated_at
});


/*
|--------------------------------------------------------------------------
| 1. Approval Summary
|--------------------------------------------------------------------------
*/

const getApprovalReport = async ({
    societyId,
    fromDate,
    toDate,
    limit = 500,
    includeDetails = true
}) => {

    const where = await getSocietyApprovalScope(societyId);

    if (fromDate || toDate) {

        where.created_at =
            buildDateFilter(fromDate, toDate);
    }


    const totalApprovals =
        await LifecycleApproval.count({
            where
        });


    const pendingApprovals =
        await LifecycleApproval.count({
            where: {
                ...where,
                status: "PENDING"
            }
        });


    const approvedApprovals =
        await LifecycleApproval.count({
            where: {
                ...where,
                status: "APPROVED"
            }
        });


    const rejectedApprovals =
        await LifecycleApproval.count({
            where: {
                ...where,
                status: "REJECTED"
            }
        });


    const documentVerification =
        await LifecycleApproval.count({
            where: {
                ...where,
                approvalType: "DOCUMENT_VERIFICATION"
            }
        });


    const moveInApprovals =
        await LifecycleApproval.count({
            where: {
                ...where,
                approvalType: "MOVE_IN_APPROVAL"
            }
        });


    const moveOutApprovals =
        await LifecycleApproval.count({
            where: {
                ...where,
                approvalType: "MOVE_OUT_APPROVAL"
            }
        });


    const financialClearance =
        await LifecycleApproval.count({
            where: {
                ...where,
                approvalType: "FINANCIAL_CLEARANCE"
            }
        });

    const genericRequests = await listGenericApprovalRequests(societyId, fromDate, toDate);
    const genericStatusCounts = genericRequests.reduce((counts, request) => {
        const status = String(request.status || "UNKNOWN").toUpperCase();
        counts[status] = (counts[status] || 0) + 1;
        return counts;
    }, {});

    let details = [];
    if (includeDetails) {
        const approvalRows = await LifecycleApproval.findAll({
            where,
            attributes: ["lifecycleType", "lifecycleId", "approvalType", "status", "assignedTo", "actionBy", "actionAt", "remarks", "created_at"],
            order: [["created_at", "DESC"]],
            limit: Math.min(Math.max(Number(limit) || 500, 1), 5000),
            raw: true
        });

        const moveInIds = approvalRows.filter((row) => row.lifecycleType === "MOVE_IN").map((row) => row.lifecycleId);
        const moveOutIds = approvalRows.filter((row) => row.lifecycleType === "MOVE_OUT").map((row) => row.lifecycleId);
        const [moveIns, moveOuts] = await Promise.all([
            moveInIds.length ? MoveIn.findAll({
                where: { id: { [Op.in]: moveInIds } },
                attributes: ["id", "unitId", "residentId", "requestedMoveInDate", "status"],
                raw: true
            }) : [],
            moveOutIds.length ? MoveOut.findAll({
                where: { id: { [Op.in]: moveOutIds } },
                attributes: ["id", "unitId", "residentId", "requestedMoveOutDate", "status"],
                raw: true
            }) : []
        ]);
        const lifecycleById = new Map([
            ...moveIns.map((row) => [row.id, { ...row, requestedDate: row.requestedMoveInDate }]),
            ...moveOuts.map((row) => [row.id, { ...row, requestedDate: row.requestedMoveOutDate }])
        ]);
        const lifecycleRows = [...moveIns, ...moveOuts];
        const unitIds = [...new Set(lifecycleRows.map((row) => row.unitId).filter(Boolean))];
        const residentIds = [...new Set(lifecycleRows.map((row) => row.residentId).filter(Boolean))];
        const userIds = [...new Set(approvalRows.flatMap((row) => [row.assignedTo, row.actionBy]).filter(Boolean))];
        const [units, residents, users] = await Promise.all([
            unitIds.length ? Unit.findAll({ where: { id: { [Op.in]: unitIds } }, attributes: ["id", "unitNumber"], raw: true }) : [],
            residentIds.length ? Resident.findAll({ where: { id: { [Op.in]: residentIds } }, attributes: ["id", "firstName", "middleName", "lastName", "displayName"], raw: true }) : [],
            usersRepository.findNamesByIds(userIds)
        ]);
        const unitById = new Map(units.map((row) => [row.id, row.unitNumber]));
        const residentById = new Map(residents.map((row) => [row.id, row.displayName || [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" ")]));
        const userById = new Map(users.map((row) => [row.id, [row.first_name, row.last_name].filter(Boolean).join(" ")]));
        const now = Date.now();

        details = approvalRows.map((row) => {
            const lifecycle = lifecycleById.get(row.lifecycleId);
            const startAt = new Date(row.created_at).getTime();
            const endAt = row.actionAt ? new Date(row.actionAt).getTime() : now;
            return {
                requestType: row.lifecycleType,
                approvalType: row.approvalType,
                status: row.status,
                resident: lifecycle ? residentById.get(lifecycle.residentId) || "Resident unavailable" : "Request unavailable",
                unit: lifecycle ? unitById.get(lifecycle.unitId) || "Unit unavailable" : "-",
                requestStatus: lifecycle?.status || "-",
                requestedDate: lifecycle?.requestedDate || null,
                assignedTo: row.assignedTo ? userById.get(row.assignedTo) || "User unavailable" : "Unassigned",
                actionBy: row.actionBy ? userById.get(row.actionBy) || "User unavailable" : "-",
                createdAt: row.created_at,
                actionAt: row.actionAt,
                processingHours: Number(((endAt - startAt) / (1000 * 60 * 60)).toFixed(2)),
                remarks: row.remarks || "-"
            };
        });
    }


    return {

        totalApprovals: totalApprovals + genericRequests.length,

        status: {
            pending: pendingApprovals + (genericStatusCounts.PENDING || 0) + (genericStatusCounts.INFO_REQUIRED || 0),
            approved: approvedApprovals + (genericStatusCounts.APPROVED || 0),
            rejected: rejectedApprovals + (genericStatusCounts.REJECTED || 0),
            cancelled: genericStatusCounts.CANCELLED || 0
        },

        approvalType: {
            documentVerification,
            moveInApprovals,
            moveOutApprovals,
            financialClearance
        },
        details: includeDetails
            ? [...genericRequests.map(formatGenericApproval), ...details].slice(0, Math.min(Math.max(Number(limit) || 500, 1), 5000))
            : []
    };
};


/*
|--------------------------------------------------------------------------
| 2. Approval Status Report
|--------------------------------------------------------------------------
*/

const getApprovalStatusReport = async ({
    societyId,
    fromDate,
    toDate
}) => {

    const where = await getSocietyApprovalScope(societyId);

    if (fromDate || toDate) {

        where.created_at =
            buildDateFilter(fromDate, toDate);
    }


    const rows =
        await LifecycleApproval.findAll({
            attributes: [
                "status",
                [
                    fn("COUNT", col("id")),
                    "count"
                ]
            ],

            where,

            group: ["status"],

            order: [
                ["status", "ASC"]
            ],

            raw: true
        });


    const genericRequests = await listGenericApprovalRequests(societyId, fromDate, toDate);
    const counts = new Map(rows.map((row) => [row.status, Number(row.count)]));
    genericRequests.forEach((request) => {
        const status = String(request.status || "UNKNOWN").toUpperCase();
        counts.set(status, (counts.get(status) || 0) + 1);
    });

    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([status, count]) => ({
        status,
        count
    }));
};


/*
|--------------------------------------------------------------------------
| 3. SLA Report
|--------------------------------------------------------------------------
|
| LifecycleApproval does not contain a dedicated SLA field.
|
| Therefore:
|
| Pending approval:
|     current time - created_at
|
| Completed approval:
|     action_at - created_at
|
| This gives actual processing duration.
|--------------------------------------------------------------------------
*/

const getSlaReport = async ({
    societyId,
    fromDate,
    toDate,
    limit = 500
}) => {

    const where = await getSocietyApprovalScope(societyId);

    if (fromDate || toDate) {

        where.created_at =
            buildDateFilter(fromDate, toDate);
    }


    const approvals =
        await LifecycleApproval.findAll({
            where,

            attributes: [
                "id",
                "lifecycleType",
                "approvalType",
                "status",
                "created_at",
                "actionAt"
            ],

            order: [
                ["created_at", "ASC"]
            ],

            raw: true
        });


    const now = new Date();


    let pendingCount = 0;
    let completedCount = 0;

    let totalCompletedHours = 0;
    let totalPendingHours = 0;


    const details = approvals.map((approval) => {

        const created_at =
            new Date(approval.created_at);


        let processingHours = null;


        if (approval.actionAt) {

            const actionAt =
                new Date(approval.actionAt);

            processingHours =
                (
                    actionAt.getTime()
                    -
                    created_at.getTime()
                )
                /
                (
                    1000 * 60 * 60
                );

            totalCompletedHours +=
                processingHours;

            completedCount++;

        } else {

            processingHours =
                (
                    now.getTime()
                    -
                    created_at.getTime()
                )
                /
                (
                    1000 * 60 * 60
                );

            totalPendingHours +=
                processingHours;

            pendingCount++;
        }


        return {

            id: approval.id,

            lifecycleType:
                approval.lifecycleType,

            approvalType:
                approval.approvalType,

            status:
                approval.status,

            created_at:
                approval.created_at,

            actionAt:
                approval.actionAt,

            processingHours:
                Number(
                    processingHours.toFixed(2)
                )
        };
    });

    const genericRequests = await listGenericApprovalRequests(societyId, fromDate, toDate);
    genericRequests.forEach((request) => {
        const pending = ["PENDING", "INFO_REQUIRED"].includes(String(request.status).toUpperCase());
        const startAt = new Date(request.created_at).getTime();
        const endAt = pending ? now.getTime() : new Date(request.updated_at || request.created_at).getTime();
        const processingHours = Math.max(0, (endAt - startAt) / (1000 * 60 * 60));
        if (pending) {
            pendingCount++;
            totalPendingHours += processingHours;
        } else {
            completedCount++;
            totalCompletedHours += processingHours;
        }
        details.push({
            ...formatGenericApproval(request),
            processingHours: Number(processingHours.toFixed(2))
        });
    });


    const averageCompletedHours =
        completedCount > 0
            ? totalCompletedHours / completedCount
            : 0;


    const averagePendingHours =
        pendingCount > 0
            ? totalPendingHours / pendingCount
            : 0;


    return {

        slaDefinition:
            "Processing duration calculated from created_at to action_at. Pending approvals use current time.",

        totalApprovals:
            approvals.length + genericRequests.length,

        pendingApprovals:
            pendingCount,

        completedApprovals:
            completedCount,

        averageCompletedProcessingHours:
            Number(
                averageCompletedHours.toFixed(2)
            ),

        averagePendingAgeHours:
            Number(
                averagePendingHours.toFixed(2)
            ),

        details: details.slice(0, Math.min(Math.max(Number(limit) || 500, 1), 5000))
    };
};


/*
|--------------------------------------------------------------------------
| 4. Payment Report
|--------------------------------------------------------------------------
*/

const getPaymentReport = async ({
    societyId,
    fromDate,
    toDate
}) => {

    const where = {
        societyId
    };


    if (fromDate || toDate) {

        where.paymentDate =
            buildDateFilter(
                fromDate,
                toDate
            );
    }


    const totalPayments =
        await Payment.count({
            where
        });


    const successfulPayments =
        await Payment.count({
            where: {
                ...where,
                status: "SUCCESS"
            }
        });


    const verifiedPayments =
        await Payment.count({
            where: {
                ...where,
                status: "VERIFIED"
            }
        });


    const pendingPayments =
        await Payment.count({
            where: {
                ...where,
                status: "PENDING"
            }
        });


    const initiatedPayments =
        await Payment.count({
            where: {
                ...where,
                status: "INITIATED"
            }
        });


    const failedPayments =
        await Payment.count({
            where: {
                ...where,
                status: "FAILED"
            }
        });


    const cancelledPayments =
        await Payment.count({
            where: {
                ...where,
                status: "CANCELLED"
            }
        });


    const refundedPayments =
        await Payment.count({
            where: {
                ...where,
                status: "REFUNDED"
            }
        });


    const verificationPendingPayments =
        await Payment.count({
            where: {
                ...where,
                status: "VERIFICATION_PENDING"
            }
        });


    /*
    |--------------------------------------------------------------------------
    | Collection
    |--------------------------------------------------------------------------
    */

    const collectionResult =
        await Payment.findOne({
            attributes: [
                [
                    fn(
                        "COALESCE",
                        fn(
                            "SUM",
                            col("amount")
                        ),
                        0
                    ),
                    "totalCollection"
                ]
            ],

            where: {
                ...where,

                status: {
                    [Op.in]: [
                        "SUCCESS",
                        "VERIFIED"
                    ]
                }
            },

            raw: true
        });


    const totalCollection =
        Number(
            collectionResult.totalCollection || 0
        );


    /*
    |--------------------------------------------------------------------------
    | Payment Method Breakdown
    |--------------------------------------------------------------------------
    */

    const methodRows =
        await Payment.findAll({

            attributes: [
                "paymentMethod",

                [
                    fn(
                        "COUNT",
                        col("id")
                    ),
                    "count"
                ],

                [
                    fn(
                        "COALESCE",
                        fn(
                            "SUM",
                            col("amount")
                        ),
                        0
                    ),
                    "amount"
                ]
            ],

            where: {
                ...where,

                status: {
                    [Op.in]: [
                        "SUCCESS",
                        "VERIFIED"
                    ]
                }
            },

            group: [
                "paymentMethod"
            ],

            order: [
                ["paymentMethod", "ASC"]
            ],

            raw: true
        });


    const paymentMethodBreakdown =
        methodRows.map((row) => ({
            paymentMethod:
                row.paymentMethod,

            count:
                Number(row.count),

            amount:
                Number(row.amount || 0)
        }));


    return {

        totalPayments,

        status: {

            initiated:
                initiatedPayments,

            pending:
                pendingPayments,

            success:
                successfulPayments,

            verified:
                verifiedPayments,

            failed:
                failedPayments,

            cancelled:
                cancelledPayments,

            refunded:
                refundedPayments,

            verificationPending:
                verificationPendingPayments
        },

        totalCollection,

        paymentMethodBreakdown
    };
};


/*
|--------------------------------------------------------------------------
| 5. Combined 17.5 Report
|--------------------------------------------------------------------------
*/

const getApprovalsDashboard = async ({
    societyId,
    fromDate,
    toDate
}) => {

    const [
        approvalReport,
        approvalStatus,
        slaReport,
        paymentReport
    ] = await Promise.all([

        getApprovalReport({
            societyId,
            fromDate,
            toDate,
            includeDetails: false
        }),

        getApprovalStatusReport({
            societyId,
            fromDate,
            toDate
        }),

        getSlaReport({
            societyId,
            fromDate,
            toDate
        }),

        getPaymentReport({
            societyId,
            fromDate,
            toDate
        })
    ]);


    return {

        societyId,

        period: {
            fromDate:
                fromDate || null,

            toDate:
                toDate || null
        },

        approvals:
            approvalReport,

        approvalStatus,

        sla:
            slaReport,

        payments:
            paymentReport
    };
};


module.exports = {

    getApprovalReport,

    getApprovalStatusReport,

    getSlaReport,

    getPaymentReport,

    getApprovalsDashboard
};
