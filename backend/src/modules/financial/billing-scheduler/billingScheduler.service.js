const { Op } = require("sequelize");

const BillingConfig =
    require("../billing-config/billingConfig.model");

const Billing =
    require("../billing/billing.model");

const Unit =
    require("../../societies/unit/unit.model");

const Floor =
    require("../../societies/floor/floor.model");

const Tower =
    require("../../societies/tower/tower.model");

const LedgerAccount =
    require("../ledger-account/ledgerAccount.model");

const BillingService =
    require("../billing/billing.service");

const InvoiceService =
    require("../invoice/invoice.service");

const InvoiceRepository =
    require("../invoice/invoice.repository");


/*
|--------------------------------------------------------------------------
| Get Billing Period
|--------------------------------------------------------------------------
*/

const getBillingPeriod = (
    billingDate,
    frequency
) => {

    const date =
        new Date(billingDate);

    const year =
        date.getFullYear();

    const month =
        date.getMonth();

    if (frequency === "MONTHLY") {

        return date.toLocaleString(
            "en-US",
            {
                month: "long",
                year: "numeric"
            }
        );
    }

    if (frequency === "QUARTERLY") {

        const quarter =
            Math.floor(month / 3) + 1;

        return `Q${quarter} ${year}`;
    }

    if (frequency === "HALF_YEARLY") {

        const half =
            month < 6
                ? 1
                : 2;

        return `H${half} ${year}`;
    }

    if (frequency === "YEARLY") {

        return `${year}`;
    }

    /*
     * CUSTOM
     */

    return date
        .toISOString()
        .split("T")[0];
};


/*
|--------------------------------------------------------------------------
| Check Billing Cycle Day
|--------------------------------------------------------------------------
*/

const shouldRunBillingCycle = (
    billingConfig,
    billingDate
) => {

    const date =
        new Date(billingDate);

    const billingDay =
        Number(
            billingConfig.billingDay || 1
        );

    return (
        date.getDate() === billingDay
    );
};


/*
|--------------------------------------------------------------------------
| Get Active Billing Rules
|--------------------------------------------------------------------------
*/

const getActiveBillingRules = async (
    societyId,
    billingDate
) => {

    return BillingConfig.findAll({

        where: {

            societyId,

            configType:
                "BILLING_RULE",

            isActive:
                true,

            effectiveFrom: {
                [Op.lte]:
                    billingDate
            },

            [Op.or]: [

                {
                    effectiveTo:
                        null
                },

                {
                    effectiveTo: {
                        [Op.gte]:
                            billingDate
                    }
                }

            ]
        },

        order: [
            [
                "effective_from",
                "DESC"
            ]
        ]
    });
};


/*
|--------------------------------------------------------------------------
| Get Active Billing Cycle
|--------------------------------------------------------------------------
*/

const getBillingCycle = async (
    societyId,
    billingDate
) => {

    return BillingConfig.findOne({

        where: {

            societyId,

            configType:
                "BILLING_CYCLE",

            isActive:
                true,

            effectiveFrom: {
                [Op.lte]:
                    billingDate
            },

            [Op.or]: [

                {
                    effectiveTo:
                        null
                },

                {
                    effectiveTo: {
                        [Op.gte]:
                            billingDate
                    }
                }

            ]
        },

        order: [
            [
                "effective_from",
                "DESC"
            ]
        ]
    });
};


/*
|--------------------------------------------------------------------------
| Get Eligible Units
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Unit.belongsTo(Floor, {
|     as: "floor"
| })
|
| Floor.belongsTo(Tower, {
|     as: "tower"
| })
|
| Therefore Sequelize requires:
|
| as: "floor"
| as: "tower"
|
|--------------------------------------------------------------------------
*/

const getEligibleUnits = async (
    societyId
) => {

    return Unit.findAll({

        where: {

            status:
                "OCCUPIED"
        },

        include: [

            {
                model: Floor,

                as: "floor",

                required: true,

                include: [

                    {
                        model: Tower,

                        as: "tower",

                        required: true,

                        where: {

                            societyId
                        }
                    }

                ]
            }

        ]
    });
};


/*
|--------------------------------------------------------------------------
| Get Unit Area
|--------------------------------------------------------------------------
|
| Priority:
|
| 1. carpetArea
| 2. builtUpArea
| 3. 0
|
|--------------------------------------------------------------------------
*/

const getUnitArea = (
    unit
) => {

    const carpetArea =
        Number(
            unit.carpetArea || 0
        );

    if (carpetArea > 0) {

        return carpetArea;
    }

    const builtUpArea =
        Number(
            unit.builtUpArea || 0
        );

    return builtUpArea;
};


/*
|--------------------------------------------------------------------------
| Calculate Penalty
|--------------------------------------------------------------------------
|
| Penalty is applied only against
| previous outstanding balance.
|
| NOTE:
| This is the current basic penalty
| implementation. Detailed overdue-day
| calculation can be enhanced later.
|
|--------------------------------------------------------------------------
*/

const calculatePenalty = async ({
    societyId,
    billDate,
    previousBalance
}) => {

    const outstanding =
        Number(
            previousBalance || 0
        );

    /*
     * No previous outstanding
     */

    if (outstanding <= 0) {

        return 0;
    }


    /*
     * Find active penalty rule
     */

    const penaltyConfig =
        await BillingConfig.findOne({

            where: {

                societyId,

                configType:
                    "PENALTY_RULE",

                isActive:
                    true,

                effectiveFrom: {
                    [Op.lte]:
                        billDate
                },

                [Op.or]: [

                    {
                        effectiveTo:
                            null
                    },

                    {
                        effectiveTo: {
                            [Op.gte]:
                                billDate
                        }
                    }

                ]
            },

            order: [
                [
                    "effective_from",
                    "DESC"
                ]
            ]
        });


    /*
     * No penalty configuration
     */

    if (!penaltyConfig) {

        return 0;
    }


    const penaltyValue =
        Number(
            penaltyConfig.penaltyValue || 0
        );

    const gracePeriodDays =
        Number(
            penaltyConfig.gracePeriodDays || 0
        );


    /*
     * Current scheduler does not
     * calculate individual overdue
     * days.
     *
     * Therefore if a grace period is
     * configured, do not apply penalty
     * here.
     */

    if (gracePeriodDays > 0) {

        return 0;
    }


    /*
     * Percentage penalty
     */

    if (
        penaltyConfig.penaltyType ===
        "PERCENTAGE"
    ) {

        return Number(
            (
                outstanding *
                penaltyValue /
                100
            ).toFixed(2)
        );
    }


    /*
     * Fixed penalty
     */

    if (
        penaltyConfig.penaltyType ===
        "FIXED_AMOUNT"
    ) {

        return Number(
            penaltyValue.toFixed(2)
        );
    }


    /*
     * Daily fixed penalty
     *
     * Current scheduler applies
     * one configured penalty amount.
     */

    if (
        penaltyConfig.penaltyType ===
        "DAILY_FIXED"
    ) {

        return Number(
            penaltyValue.toFixed(2)
        );
    }


    /*
     * Daily percentage penalty
     *
     * Current scheduler applies
     * one configured percentage.
     */

    if (
        penaltyConfig.penaltyType ===
        "DAILY_PERCENTAGE"
    ) {

        return Number(
            (
                outstanding *
                penaltyValue /
                100
            ).toFixed(2)
        );
    }


    return 0;
};


/*
|--------------------------------------------------------------------------
| Generate Billing For One Unit
|--------------------------------------------------------------------------
*/

const generateForUnit = async ({
    societyId,
    unit,
    billingRule,
    billingCycle,
    billingDate
}) => {

    /*
     * Get area
     */

    const unitArea =
        getUnitArea(unit);


    /*
     * Area-based and Hybrid billing
     * require a valid area.
     */

    if (
        billingRule.billingModel !==
            "FLAT_RATE" &&
        unitArea <= 0
    ) {

        return {

            success:
                false,

            skipped:
                true,

            reason:
                "Unit does not have a valid carpetArea or builtUpArea"
        };
    }


    /*
     * Calculate billing period
     */

    const billingPeriod =
        getBillingPeriod(
            billingDate,
            billingCycle.billingFrequency
        );


    /*
     * Idempotency Key
     *
     * Same society + unit + period +
     * billing rule = same billing run.
     */

    const idempotencyKey =
        `BILLING:${societyId}:${unit.id}:${billingPeriod}:${billingRule.code}`;


    /*
     * Check existing invoice.
     *
     * This prevents the scheduler from
     * generating duplicate invoices.
     */

    const existingInvoice =
        await InvoiceRepository
            .findByIdempotencyKey(
                societyId,
                idempotencyKey
            );


    if (existingInvoice) {

        return {

            success:
                true,

            duplicate:
                true,

            invoice:
                existingInvoice
        };
    }


    /*
     * Generate unique Bill Number
     */

    const timestamp =
        Date.now();

    const unitShortId =
        String(unit.id)
            .slice(0, 6);

    const billYear =
        new Date(
            billingDate
        ).getFullYear();

    const billNumber =
        `BILL-${billYear}-${timestamp}-${unitShortId}`;


    /*
     * Generate unique Invoice Number
     */

    const invoiceNumber =
        `INV-${billYear}-${timestamp}-${unitShortId}`;


    /*
     * Find Unit Ledger Account
     */

    const ledgerAccount =
        await LedgerAccount.findOne({

            where: {

                societyId,

                unitId:
                    unit.id,

                isActive:
                    true
            }
        });


    if (!ledgerAccount) {

        return {

            success:
                false,

            skipped:
                true,

            reason:
                "Active ledger account not found for unit"
        };
    }


    /*
     * Calculate billing amount
     */

    const calculation =
        await BillingService
            .calculateCompleteBilling({

                societyId,

                unitId:
                    unit.id,

                billingRuleCode:
                    billingRule.code,

                billDate:
                    billingDate,

                unitArea,

                taxAmount:
                    0,

                penaltyAmount:
                    0
            });


    /*
     * Calculate penalty
     */

    const penaltyAmount =
        await calculatePenalty({

            societyId,

            billDate:
                billingDate,

            previousBalance:
                calculation.previousBalance
        });


    /*
     * Calculate total
     */

    const subtotal =
        Number(
            calculation.subtotal || 0
        );

    const previousBalance =
        Number(
            calculation.previousBalance || 0
        );

    const taxAmount =
        Number(
            calculation.taxAmount || 0
        );

    const totalAmount =
        Number(
            (
                subtotal +
                previousBalance +
                taxAmount +
                penaltyAmount
            ).toFixed(2)
        );


    /*
     * Calculate Due Date
     */

    const dueDays =
        Number(
            billingCycle.dueDays || 0
        );

    const dueDate =
        new Date(
            new Date(
                billingDate
            ).getTime() +
            dueDays *
            24 *
            60 *
            60 *
            1000
        );


    /*
     * Create Billing
     */

    const billing =
        await Billing.create({

            societyId,

            unitId:
                unit.id,

            memberId:
                null,

            ledgerAccountId:
                ledgerAccount.id,

            billingConfigId:
                billingRule.id,

            billNumber,

            billingPeriod,

            billDate,

            dueDate,

            description:
                `${billingRule.name} - ${billingPeriod}`,

            billingModel:
                billingRule.billingModel,

            unitArea,

            ratePerArea:
                billingRule.ratePerArea || null,

            fixedAmount:
                billingRule.fixedAmount || null,

            previousBalance,

            subtotal,

            taxAmount,

            penaltyAmount,

            totalAmount,

            paidAmount:
                0,

            outstandingAmount:
                totalAmount,

            status:
                "DRAFT"
        });


    /*
     * Create Invoice
     */

    const invoiceResult =
        await InvoiceService.createInvoice({

            societyId,

            unitId:
                unit.id,

            memberId:
                null,

            billingId:
                billing.id,

            invoiceNumber,

            billingPeriod,

            invoiceDate:
                billingDate,

            dueDate,

            idempotencyKey,

            penaltyAmount,

            description:
                `${billingRule.name} - ${billingPeriod}`,

            remarks:
                "Automatically generated by billing scheduler",

            items: [

                {

                    billingConfigId:
                        billingRule.id,

                    description:
                        billingRule.name,

                    quantity:
                        1,

                    rate:
                        subtotal,

                    taxRate:
                        billingRule.isTaxable
                            ? Number(
                                billingRule.taxRate || 0
                            )
                            : 0
                }

            ]
        });


    /*
     * Issue newly-created invoice.
     *
     * If invoice was already found
     * through idempotency, do not issue it
     * again.
     */

    if (
        !invoiceResult.duplicate
    ) {

        await InvoiceService.issueInvoice(
            invoiceResult.invoice.id
        );
    }


    /*
     * Return result
     */

    return {

        success:
            true,

        duplicate:
            Boolean(
                invoiceResult.duplicate
            ),

        billing,

        invoice:
            invoiceResult.invoice
    };
};


/*
|--------------------------------------------------------------------------
| Run Billing For Society
|--------------------------------------------------------------------------
*/

const runBillingForSociety = async ({
    societyId,
    billingDate
}) => {

    /*
     * Validate input
     */

    if (!societyId) {

        throw new Error(
            "societyId is required"
        );
    }

    if (!billingDate) {

        throw new Error(
            "billingDate is required"
        );
    }


    /*
     * Get active billing cycle
     */

    const billingCycle =
        await getBillingCycle(
            societyId,
            billingDate
        );


    if (!billingCycle) {

        throw new Error(
            "Active billing cycle not found"
        );
    }


    /*
     * Check billing day
     */

    if (
        !shouldRunBillingCycle(
            billingCycle,
            billingDate
        )
    ) {

        return {

            success:
                true,

            skipped:
                true,

            message:
                `Billing cycle is scheduled for day ${billingCycle.billingDay}`
        };
    }


    /*
     * Get active billing rules
     */

    const billingRules =
        await getActiveBillingRules(
            societyId,
            billingDate
        );


    if (
        billingRules.length === 0
    ) {

        throw new Error(
            "No active billing rules found"
        );
    }


    /*
     * Get occupied units
     */

    const units =
        await getEligibleUnits(
            societyId
        );


    /*
     * Store scheduler results
     */

    const results = [];


    /*
     * Process every billing rule
     * against every eligible unit.
     */

    for (
        const billingRule
        of billingRules
    ) {

        for (
            const unit
            of units
        ) {

            try {

                const result =
                    await generateForUnit({

                        societyId,

                        unit,

                        billingRule,

                        billingCycle,

                        billingDate
                    });


                results.push({

                    unitId:
                        unit.id,

                    billingRule:
                        billingRule.code,

                    ...result
                });

            } catch (error) {

                /*
                 * One failed unit should not
                 * stop billing for all other units.
                 */

                results.push({

                    unitId:
                        unit.id,

                    billingRule:
                        billingRule.code,

                    success:
                        false,

                    error:
                        error.message
                });
            }
        }
    }


    /*
     * Final scheduler response
     */

    return {

        success:
            true,

        societyId,

        billingDate,

        totalUnits:
            units.length,

        totalRules:
            billingRules.length,

        results
    };
};


/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {

    runBillingForSociety,

    generateForUnit,

    getBillingPeriod,

    calculatePenalty
};