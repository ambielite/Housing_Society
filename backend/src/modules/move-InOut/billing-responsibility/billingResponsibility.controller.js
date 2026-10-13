const service =
    require("./billingResponsibility.service");


const createBillingResponsibility =
    async (req, res) => {

        try {

            const responsibility =
                await service.createBillingResponsibility(
                    req.body
                );

            res.status(201).json({
                success: true,
                message:
                    "Billing responsibility created successfully",
                data: responsibility
            });

        } catch (error) {

            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    };


const getBillingResponsibilities =
    async (req, res) => {

        try {

            const responsibilities =
                await service.getBillingResponsibilities();

            res.status(200).json({
                success: true,
                data: responsibilities
            });

        } catch (error) {

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };


const getBillingResponsibility =
    async (req, res) => {

        try {

            const responsibility =
                await service.getBillingResponsibility(
                    req.params.id
                );

            if (!responsibility) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Billing responsibility not found"
                });
            }

            res.status(200).json({
                success: true,
                data: responsibility
            });

        } catch (error) {

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };


const getCurrentByUnit =
    async (req, res) => {

        try {

            const responsibility =
                await service.getCurrentByUnit(
                    req.params.unitId
                );

            res.status(200).json({
                success: true,
                data: responsibility
            });

        } catch (error) {

            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    };


const getHistoryByUnit =
    async (req, res) => {

        try {

            const responsibilities =
                await service.getHistoryByUnit(
                    req.params.unitId
                );

            res.status(200).json({
                success: true,
                data: responsibilities
            });

        } catch (error) {

            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    };


const getHistoryByResident =
    async (req, res) => {

        try {

            const responsibilities =
                await service.getHistoryByResident(
                    req.params.residentId
                );

            res.status(200).json({
                success: true,
                data: responsibilities
            });

        } catch (error) {

            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    };


const getCurrentByResident =
    async (req, res) => {

        try {

            const responsibilities =
                await service.getCurrentByResident(
                    req.params.residentId
                );

            res.status(200).json({
                success: true,
                data: responsibilities
            });

        } catch (error) {

            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    };


const closeResponsibility =
    async (req, res) => {

        try {

            const responsibility =
                await service.closeResponsibility(
                    req.params.id,
                    req.body.endDate
                );

            res.status(200).json({
                success: true,
                message:
                    "Billing responsibility closed successfully",
                data: responsibility
            });

        } catch (error) {

            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    };


const transferResponsibility =
    async (req, res) => {

        try {

            const responsibility =
                await service.transferResponsibility(
                    req.body
                );

            res.status(201).json({
                success: true,
                message:
                    "Billing responsibility transferred successfully",
                data: responsibility
            });

        } catch (error) {

            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    };


const updateBillingResponsibility =
    async (req, res) => {

        try {

            const responsibility =
                await service.updateBillingResponsibility(
                    req.params.id,
                    req.body
                );

            res.status(200).json({
                success: true,
                message:
                    "Billing responsibility updated successfully",
                data: responsibility
            });

        } catch (error) {

            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    };


const deleteBillingResponsibility =
    async (req, res) => {

        try {

            const responsibility =
                await service.deleteBillingResponsibility(
                    req.params.id
                );

            res.status(200).json({
                success: true,
                message:
                    "Billing responsibility deleted successfully",
                data: responsibility
            });

        } catch (error) {

            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    };


module.exports = {
    createBillingResponsibility,
    getBillingResponsibilities,
    getBillingResponsibility,
    getCurrentByUnit,
    getHistoryByUnit,
    getHistoryByResident,
    getCurrentByResident,
    closeResponsibility,
    transferResponsibility,
    updateBillingResponsibility,
    deleteBillingResponsibility
};