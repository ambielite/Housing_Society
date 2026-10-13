const { Op, fn, col, literal } = require("sequelize");

const Society = require("../../../modules/societies/society/society.model");

const Invoice = require("../../../modules/financial/invoice/invoice.model");
const Payment = require("../../../modules/financial/payment/payment.model");


// ============================================================
// GET SOCIETIES UNDER CLUSTER
// ============================================================

const getClusterSocieties = async (clusterId) => {

    return await Society.findAll({

        where: {
            clusterId
        },

        attributes: [
            "id",
            "name",
            "organizationId",
            "clusterId"
        ],

        order: [
            ["name", "ASC"]
        ]
    });
};


// ============================================================
// GET SOCIETY IDS
// ============================================================

const getSocietyIds = async (clusterId) => {

    const societies = await Society.findAll({

        where: {
            clusterId
        },

        attributes: [
            "id"
        ],

        raw: true
    });

    return societies.map(
        society => society.id
    );
};


// ============================================================
// GET TOTAL BILLED / INVOICE SUMMARY
// ============================================================

const getInvoiceSummary = async (societyIds) => {

    if (!societyIds || societyIds.length === 0) {

        return {
            totalInvoices: 0,
            totalBilled: 0
        };
    }


    const result = await Invoice.findOne({

        where: {
            societyId: {
                [Op.in]: societyIds
            }
        },

        attributes: [

            // ------------------------------------------------
            // TOTAL INVOICES
            // ------------------------------------------------

            [
                fn(
                    "COUNT",
                    col("id")
                ),
                "totalInvoices"
            ],


            // ------------------------------------------------
            // TOTAL BILLED
            //
            // Actual DB column:
            // total_amount
            // ------------------------------------------------

            [
                fn(
                    "COALESCE",
                    fn(
                        "SUM",
                        literal('"Invoice"."total_amount"')
                    ),
                    0
                ),
                "totalBilled"
            ]
        ],

        raw: true
    });


    return {

        totalInvoices:
            Number(
                result?.totalInvoices || 0
            ),

        totalBilled:
            Number(
                result?.totalBilled || 0
            )
    };
};


// ============================================================
// GET PAYMENT SUMMARY
// ============================================================

const getPaymentSummary = async (societyIds) => {

    if (!societyIds || societyIds.length === 0) {

        return {
            totalPayments: 0,
            totalCollected: 0,
            successfulPayments: 0,
            failedPayments: 0
        };
    }


    const result = await Payment.findOne({

        where: {
            societyId: {
                [Op.in]: societyIds
            }
        },

        attributes: [

            // ------------------------------------------------
            // TOTAL PAYMENTS
            // ------------------------------------------------

            [
                fn(
                    "COUNT",
                    col("id")
                ),
                "totalPayments"
            ],


            // ------------------------------------------------
            // TOTAL COLLECTED
            // ------------------------------------------------

            [
                fn(
                    "COALESCE",
                    fn(
                        "SUM",
                        literal(`
                            CASE
                                WHEN "Payment"."status"
                                IN ('SUCCESS', 'VERIFIED')
                                THEN "Payment"."amount"
                                ELSE 0
                            END
                        `)
                    ),
                    0
                ),
                "totalCollected"
            ],


            // ------------------------------------------------
            // SUCCESSFUL PAYMENTS
            // ------------------------------------------------

            [
                fn(
                    "COUNT",
                    literal(`
                        CASE
                            WHEN "Payment"."status"
                            IN ('SUCCESS', 'VERIFIED')
                            THEN 1
                        END
                    `)
                ),
                "successfulPayments"
            ],


            // ------------------------------------------------
            // FAILED PAYMENTS
            // ------------------------------------------------

            [
                fn(
                    "COUNT",
                    literal(`
                        CASE
                            WHEN "Payment"."status" = 'FAILED'
                            THEN 1
                        END
                    `)
                ),
                "failedPayments"
            ]
        ],

        raw: true
    });


    return {

        totalPayments:
            Number(
                result?.totalPayments || 0
            ),

        totalCollected:
            Number(
                result?.totalCollected || 0
            ),

        successfulPayments:
            Number(
                result?.successfulPayments || 0
            ),

        failedPayments:
            Number(
                result?.failedPayments || 0
            )
    };
};


// ============================================================
// GET SOCIETY-WISE SUMMARY
// ============================================================

const getSocietySummary = async (societyIds) => {

    if (!societyIds || societyIds.length === 0) {

        return [];
    }


    const societies = await Society.findAll({

        where: {
            id: {
                [Op.in]: societyIds
            }
        },

        attributes: [
            "id",
            "name"
        ],

        order: [
            ["name", "ASC"]
        ],

        raw: true
    });


    const result = [];


    for (const society of societies) {

        const invoiceSummary =
            await getInvoiceSummary([
                society.id
            ]);


        const paymentSummary =
            await getPaymentSummary([
                society.id
            ]);


        // ----------------------------------------------------
        // OUTSTANDING
        //
        // outstanding = billed - collected
        // ----------------------------------------------------

        const totalOutstanding =
            Math.max(
                0,
                invoiceSummary.totalBilled -
                paymentSummary.totalCollected
            );


        result.push({

            societyId:
                society.id,

            societyName:
                society.name,

            totalInvoices:
                invoiceSummary.totalInvoices,

            totalBilled:
                invoiceSummary.totalBilled,

            totalOutstanding,

            totalPayments:
                paymentSummary.totalPayments,

            totalCollected:
                paymentSummary.totalCollected,

            successfulPayments:
                paymentSummary.successfulPayments,

            failedPayments:
                paymentSummary.failedPayments
        });
    }


    return result;
};


// ============================================================
// GET COMPLETE CLUSTER FINANCIAL SUMMARY
// ============================================================

const getClusterFinancialSummary = async (societyIds) => {

    const invoiceSummary =
        await getInvoiceSummary(
            societyIds
        );


    const paymentSummary =
        await getPaymentSummary(
            societyIds
        );


    const totalOutstanding =
        Math.max(
            0,
            invoiceSummary.totalBilled -
            paymentSummary.totalCollected
        );


    return {

        totalInvoices:
            invoiceSummary.totalInvoices,

        totalBilled:
            invoiceSummary.totalBilled,

        totalCollected:
            paymentSummary.totalCollected,

        totalOutstanding,

        totalPayments:
            paymentSummary.totalPayments,

        successfulPayments:
            paymentSummary.successfulPayments,

        failedPayments:
            paymentSummary.failedPayments
    };
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {

    getClusterSocieties,

    getSocietyIds,

    getInvoiceSummary,

    getPaymentSummary,

    getSocietySummary,

    getClusterFinancialSummary
};