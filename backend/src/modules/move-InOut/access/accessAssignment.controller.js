const service = require("./accessAssignment.service");


const createAccessAssignment = async (
    req,
    res
) => {
    try {

        const assignment =
            await service.createAccessAssignment(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Access assigned successfully",
            data: assignment
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getAccessAssignments = async (
    req,
    res
) => {
    try {

        const assignments =
            await service.getAccessAssignments();

        res.status(200).json({
            success: true,
            data: assignments
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getAccessAssignment = async (
    req,
    res
) => {
    try {

        const assignment =
            await service.getAccessAssignment(
                req.params.id
            );

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message:
                    "Access assignment not found"
            });
        }

        res.status(200).json({
            success: true,
            data: assignment
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getActiveAccess = async (
    req,
    res
) => {
    try {

        const assignments =
            await service.getActiveAccess();

        res.status(200).json({
            success: true,
            data: assignments
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getActiveAccessByUnit = async (
    req,
    res
) => {
    try {

        const assignment =
            await service.getActiveAccessByUnit(
                req.params.unitId
            );

        res.status(200).json({
            success: true,
            data: assignment
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getActiveAccessByResident = async (
    req,
    res
) => {
    try {

        const assignments =
            await service.getActiveAccessByResident(
                req.params.residentId
            );

        res.status(200).json({
            success: true,
            data: assignments
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getAccessHistoryByUnit = async (
    req,
    res
) => {
    try {

        const assignments =
            await service.getAccessHistoryByUnit(
                req.params.unitId
            );

        res.status(200).json({
            success: true,
            data: assignments
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getAccessHistoryByResident = async (
    req,
    res
) => {
    try {

        const assignments =
            await service.getAccessHistoryByResident(
                req.params.residentId
            );

        res.status(200).json({
            success: true,
            data: assignments
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getAccessByLifecycle = async (
    req,
    res
) => {
    try {

        const assignments =
            await service.getAccessByLifecycle(
                req.params.lifecycleType,
                req.params.lifecycleId
            );

        res.status(200).json({
            success: true,
            data: assignments
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const revokeAccess = async (
    req,
    res
) => {
    try {

        const assignment =
            await service.revokeAccess(
                req.params.id,
                req.body.revokedBy,
                req.body.remarks
            );

        res.status(200).json({
            success: true,
            message:
                "Access revoked successfully",
            data: assignment
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const suspendAccess = async (
    req,
    res
) => {
    try {

        const assignment =
            await service.suspendAccess(
                req.params.id,
                req.body.remarks
            );

        res.status(200).json({
            success: true,
            message:
                "Access suspended successfully",
            data: assignment
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const reactivateAccess = async (
    req,
    res
) => {
    try {

        const assignment =
            await service.reactivateAccess(
                req.params.id,
                req.body.activatedBy,
                req.body.remarks
            );

        res.status(200).json({
            success: true,
            message:
                "Access reactivated successfully",
            data: assignment
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteAccessAssignment = async (
    req,
    res
) => {
    try {

        const assignment =
            await service.deleteAccessAssignment(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Access assignment deleted successfully",
            data: assignment
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    createAccessAssignment,
    getAccessAssignments,
    getAccessAssignment,
    getActiveAccess,
    getActiveAccessByUnit,
    getActiveAccessByResident,
    getAccessHistoryByUnit,
    getAccessHistoryByResident,
    getAccessByLifecycle,
    revokeAccess,
    suspendAccess,
    reactivateAccess,
    deleteAccessAssignment
};