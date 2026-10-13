const service =
    require("./financialClearance.service");


const createFinancialClearance = async (req, res) => {

    try {

        const clearance =
            await service.createFinancialClearance(
                req.body
            );

        return res.status(201).json({
            success: true,
            message:
                "Financial clearance created successfully",
            data: clearance
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getFinancialClearances = async (req, res) => {

    try {

        const clearances =
            await service.getFinancialClearances();

        return res.status(200).json({
            success: true,
            data: clearances
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getFinancialClearance = async (req, res) => {

    try {

        const clearance =
            await service.getFinancialClearance(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            data: clearance
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const getPendingClearances = async (req, res) => {

    try {

        const clearances =
            await service.getPendingClearances();

        return res.status(200).json({
            success: true,
            data: clearances
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getClearancesByLifecycle = async (req, res) => {

    try {

        const clearances =
            await service.getClearancesByLifecycle(
                req.params.lifecycleId
            );

        return res.status(200).json({
            success: true,
            data: clearances
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const clearFinancialClearance = async (req, res) => {

    try {

        const clearance =
            await service.clearFinancialClearance(
                req.params.id,
                req.body.clearedBy,
                req.body.remarks
            );

        return res.status(200).json({
            success: true,
            message:
                "Financial clearance completed successfully",
            data: clearance
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const putOnHold = async (req, res) => {

    try {

        const clearance =
            await service.putOnHold(
                req.params.id,
                req.body.remarks
            );

        return res.status(200).json({
            success: true,
            message:
                "Financial clearance put on hold",
            data: clearance
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const updateOutstandingAmount = async (req, res) => {

    try {

        const clearance =
            await service.updateOutstandingAmount(
                req.params.id,
                req.body.outstandingAmount,
                req.body.remarks
            );

        return res.status(200).json({
            success: true,
            message:
                "Outstanding amount updated successfully",
            data: clearance
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteFinancialClearance = async (req, res) => {

    try {

        await service.deleteFinancialClearance(
            req.params.id
        );

        return res.status(200).json({
            success: true,
            message:
                "Financial clearance deleted successfully"
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {

    createFinancialClearance,

    getFinancialClearances,

    getFinancialClearance,

    getPendingClearances,

    getClearancesByLifecycle,

    clearFinancialClearance,

    putOnHold,

    updateOutstandingAmount,

    deleteFinancialClearance
};