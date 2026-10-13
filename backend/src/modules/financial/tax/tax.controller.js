const TaxService =
    require("./tax.service");


const createTax = async (
    req,
    res
) => {

    try {

        const tax =
            await TaxService.createTax(
                req.body
            );

        return res.status(201).json({

            success: true,

            message:
                "Tax configuration created successfully",

            data:
                tax
        });

    } catch (error) {

        console.error(
            "Create tax error:",
            error
        );

        return res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


const calculateTax = async (
    req,
    res
) => {

    try {

        const result =
            await TaxService.calculateTax(
                req.body.baseAmount,
                req.body.taxRate,
                req.body.calculationMethod,
                req.body.fixedAmount
            );

        return res.status(200).json({

            success: true,

            data: {
                baseAmount:
                    Number(
                        req.body.baseAmount
                    ),

                taxAmount:
                    result,

                totalAmount:
                    Number(
                        req.body.baseAmount
                    ) + result
            }
        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


const calculateGST = async (
    req,
    res
) => {

    try {

        const result =
            await TaxService.calculateGST(
                req.body.baseAmount,
                req.body.gstRate,
                req.body.gstType
            );

        return res.status(200).json({

            success: true,

            data:
                result
        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


const calculateTDS = async (
    req,
    res
) => {

    try {

        const result =
            await TaxService.calculateTDS(
                req.body.baseAmount,
                req.body.tdsRate
            );

        return res.status(200).json({

            success: true,

            data:
                result
        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


const calculateInvoiceTax = async (
    req,
    res
) => {

    try {

        const result =
            await TaxService
                .calculateInvoiceTax(
                    req.body.societyId,
                    req.body.baseAmount,
                    req.body.date ||
                        new Date(),
                    req.body.taxType
                );

        return res.status(200).json({

            success: true,

            data:
                result
        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


const getById = async (
    req,
    res
) => {

    try {

        const tax =
            await TaxService.getById(
                req.params.id
            );

        return res.status(200).json({

            success: true,

            data:
                tax
        });

    } catch (error) {

        return res.status(404).json({

            success: false,

            message:
                error.message
        });
    }
};


const getAll = async (
    req,
    res
) => {

    try {

        const taxes =
            await TaxService.getAll({

                societyId:
                    req.query.societyId,

                taxType:
                    req.query.taxType,

                isActive:
                    req.query.isActive
            });

        return res.status(200).json({

            success: true,

            count:
                taxes.length,

            data:
                taxes
        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message:
                error.message
        });
    }
};


const updateTax = async (
    req,
    res
) => {

    try {

        const tax =
            await TaxService.updateTax(
                req.params.id,
                req.body
            );

        return res.status(200).json({

            success: true,

            message:
                "Tax configuration updated successfully",

            data:
                tax
        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


const deactivateTax = async (
    req,
    res
) => {

    try {

        const tax =
            await TaxService.deactivateTax(
                req.params.id
            );

        return res.status(200).json({

            success: true,

            message:
                "Tax configuration deactivated successfully",

            data:
                tax
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
    createTax,
    calculateTax,
    calculateGST,
    calculateTDS,
    calculateInvoiceTax,
    getById,
    getAll,
    updateTax,
    deactivateTax
};