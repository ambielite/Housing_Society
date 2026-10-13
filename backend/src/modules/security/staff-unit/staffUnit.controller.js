const StaffUnitService =
    require("./staffUnit.service");


const createAssignment = async (
    req,
    res
) => {

    try {

        const result =
            await StaffUnitService
                .createAssignment(req.body);

        return res.status(201).json({
            success: true,
            message:
                "Staff assigned to unit successfully",
            data: result
        });

    } catch (error) {

        console.error(
            "Create staff-unit assignment error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getAllAssignments = async (
    req,
    res
) => {

    try {

        const filters = {};

        if (req.query.staffId) {
            filters.staffId =
                req.query.staffId;
        }

        if (req.query.unitId) {
            filters.unitId =
                req.query.unitId;
        }

        if (req.query.status) {
            filters.status =
                req.query.status;
        }

        if (req.query.assignmentType) {
            filters.assignmentType =
                req.query.assignmentType;
        }

        const result =
            await StaffUnitService
                .getAllAssignments(filters);

        return res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getAssignmentById = async (
    req,
    res
) => {

    try {

        const result =
            await StaffUnitService
                .getAssignmentById(
                    req.params.id
                );

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const getAssignmentsByStaff = async (
    req,
    res
) => {

    try {

        const result =
            await StaffUnitService
                .getAssignmentsByStaff(
                    req.params.staffId
                );

        return res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const getAssignmentsByUnit = async (
    req,
    res
) => {

    try {

        const result =
            await StaffUnitService
                .getAssignmentsByUnit(
                    req.params.unitId
                );

        return res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const updateAssignment = async (
    req,
    res
) => {

    try {

        const result =
            await StaffUnitService
                .updateAssignment(
                    req.params.id,
                    req.body
                );

        return res.status(200).json({
            success: true,
            message:
                "Staff-unit assignment updated successfully",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const activateAssignment = async (
    req,
    res
) => {

    try {

        const result =
            await StaffUnitService
                .activateAssignment(
                    req.params.id
                );

        return res.status(200).json({
            success: true,
            message:
                "Staff-unit assignment activated",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deactivateAssignment = async (
    req,
    res
) => {

    try {

        const result =
            await StaffUnitService
                .deactivateAssignment(
                    req.params.id
                );

        return res.status(200).json({
            success: true,
            message:
                "Staff-unit assignment deactivated",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const completeAssignment = async (
    req,
    res
) => {

    try {

        const result =
            await StaffUnitService
                .completeAssignment(
                    req.params.id
                );

        return res.status(200).json({
            success: true,
            message:
                "Staff-unit assignment completed",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteAssignment = async (
    req,
    res
) => {

    try {

        const result =
            await StaffUnitService
                .deleteAssignment(
                    req.params.id
                );

        return res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    createAssignment,
    getAllAssignments,
    getAssignmentById,
    getAssignmentsByStaff,
    getAssignmentsByUnit,
    updateAssignment,
    activateAssignment,
    deactivateAssignment,
    completeAssignment,
    deleteAssignment
};