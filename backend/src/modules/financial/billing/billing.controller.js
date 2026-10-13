const service =
    require("./billing.service");


// =====================================================
// CREATE
// =====================================================

const create = async (
    req,
    res
) => {

    try {

        const billing =
            await service.createBilling(
                req.body
            );


        return res.status(201).json({

            success: true,

            message:
                "Billing created successfully",

            data: billing

        });

    } catch (error) {

        console.error(
            "Create billing error:",
            error
        );

        return res.status(400).json({

            success: false,

            message:
                error.message

        });
    }
};


// =====================================================
// CALCULATE
// =====================================================

const calculate = async (
    req,
    res
) => {

    try {

        const result =
            await service.calculateCompleteBilling({

                societyId:
                    req.body.societyId,

                unitId:
                    req.body.unitId,

                billingRuleCode:
                    req.body.billingRuleCode,

                billDate:
                    req.body.billDate,

                unitArea:
                    req.body.unitArea,

                taxAmount:
                    req.body.taxAmount || 0,

                penaltyAmount:
                    req.body.penaltyAmount || 0

            });


        return res.json({

            success: true,

            message:
                "Billing amount calculated successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Billing calculation error:",
            error
        );

        return res.status(400).json({

            success: false,

            message:
                error.message

        });
    }
};


// =====================================================
// GET ALL
// =====================================================

const getAll = async (
    req,
    res
) => {

    try {

        const billings =
            await service.getAll({

                societyId:
                    req.query.societyId,

                status:
                    req.query.status,

                unitId:
                    req.query.unitId

            });


        return res.json({

            success: true,

            data: billings

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message:
                error.message

        });
    }
};


// =====================================================
// GET BY ID
// =====================================================

const getById = async (
    req,
    res
) => {

    try {

        const billing =
            await service.getById(
                req.params.id
            );


        return res.json({

            success: true,

            data: billing

        });

    } catch (error) {

        return res.status(404).json({

            success: false,

            message:
                error.message

        });
    }
};


// =====================================================
// GET BY UNIT
// =====================================================

const getByUnit = async (
    req,
    res
) => {

    try {

        const billings =
            await service.getByUnit(

                req.params.societyId,

                req.params.unitId

            );


        return res.json({

            success: true,

            data: billings

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message:
                error.message

        });
    }
};


// =====================================================
// ISSUE
// =====================================================

const issue = async (
    req,
    res
) => {

    try {

        const billing =
            await service.issueBilling(
                req.params.id
            );


        return res.json({

            success: true,

            message:
                "Billing issued successfully",

            data: billing

        });

    } catch (error) {

        console.error(
            "Issue billing error:",
            error
        );

        return res.status(400).json({

            success: false,

            message:
                error.message

        });
    }
};


// =====================================================
// UPDATE OVERDUE
// =====================================================

const updateOverdue = async (
    req,
    res
) => {

    try {

        const result =
            await service.updateOverdueBills();


        return res.json({

            success: true,

            message:
                "Overdue billing updated successfully",

            data: result

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message:
                error.message

        });
    }
};


// =====================================================
// CANCEL
// =====================================================

const cancel = async (
    req,
    res
) => {

    try {

        const billing =
            await service.cancelBilling(
                req.params.id
            );


        return res.json({

            success: true,

            message:
                "Billing cancelled successfully",

            data: billing

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message:
                error.message

        });
    }
};


// =====================================================
// DELETE
// =====================================================

const remove = async (
    req,
    res
) => {

    try {

        const result =
            await service.deleteBilling(
                req.params.id
            );


        return res.json({

            success: true,

            ...result

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message:
                error.message

        });
    }
};


module.exports = {

    create,

    calculate,

    getAll,

    getById,

    getByUnit,

    issue,

    updateOverdue,

    cancel,

    remove

};