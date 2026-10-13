
const maintenanceService =
    require("./assetMaintenance.service");

const createMaintenance = async (req, res) => {
    try {

        const maintenance =
            await maintenanceService.createMaintenance(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Maintenance record created successfully",
            data: maintenance
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getAllMaintenance = async (req, res) => {
    try {

        const maintenance =
            await maintenanceService.getAllMaintenance(
                req.query
            );

        res.status(200).json({
            success: true,
            count: maintenance.length,
            data: maintenance
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getMaintenanceById = async (req, res) => {
    try {

        const maintenance =
            await maintenanceService.getMaintenanceById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: maintenance
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

const getMaintenanceByAssetId = async (req, res) => {
    try {

        const maintenance =
            await maintenanceService.getMaintenanceByAssetId(
                req.params.assetId
            );

        res.status(200).json({
            success: true,
            count: maintenance.length,
            data: maintenance
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

const updateMaintenance = async (req, res) => {
    try {

        const maintenance =
            await maintenanceService.updateMaintenance(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message:
                "Maintenance record updated successfully",
            data: maintenance
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const startMaintenance = async (req, res) => {
    try {

        const maintenance =
            await maintenanceService.startMaintenance(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Maintenance started successfully",
            data: maintenance
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const completeMaintenance = async (req, res) => {
    try {

        const maintenance =
            await maintenanceService.completeMaintenance(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message:
                "Maintenance completed successfully",
            data: maintenance
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const cancelMaintenance = async (req, res) => {
    try {

        const maintenance =
            await maintenanceService.cancelMaintenance(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Maintenance cancelled successfully",
            data: maintenance
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const deleteMaintenance = async (req, res) => {
    try {

        const result =
            await maintenanceService.deleteMaintenance(
                req.params.id
            );

        res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createMaintenance,
    getAllMaintenance,
    getMaintenanceById,
    getMaintenanceByAssetId,
    updateMaintenance,
    startMaintenance,
    completeMaintenance,
    cancelMaintenance,
    deleteMaintenance
};

