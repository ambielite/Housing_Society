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


/*
|--------------------------------------------------------------------------
| 1. Approval Summary
|--------------------------------------------------------------------------
*/

const getApprovalReport = async ({
    societyId,
    fromDate,
    toDate
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


    return {

        totalApprovals,

        status: {
            pending: pendingApprovals,
            approved: approvedApprovals,
            rejected: rejectedApprovals
        },

        approvalType: {
            documentVerification,
            moveInApprovals,
            moveOutApprovals,
            financialClearance
        }
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


    return rows.map((row) => ({
        status: row.status,
        count: Number(row.count)
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
    toDate
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
            approvals.length,

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

        details
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
            toDate
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
