const StaffService =
    require("./staff.service");


const createStaff = async (req, res) => {

    try {

        const staff =
            await StaffService.createStaff(req.body, req.file);

        return res.status(201).json({
            success: true,
            message: "Staff created successfully",
            data: staff
        });

    } catch (error) {

        console.error(
            "Create staff error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getAllStaff = async (req, res) => {

    try {

        const filters = {};

        if (req.query.societyId) {
            filters.societyId =
                req.query.societyId;
        }

        if (req.query.status) {
            filters.status =
                req.query.status;
        }

        if (req.query.staffType) {
            filters.staffType =
                req.query.staffType;
        }

        const staff =
            await StaffService.getAllStaff(filters);

        return res.status(200).json({
            success: true,
            count: staff.length,
            data: staff
        });

    } catch (error) {

        console.error(
            "Get staff error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getStaffById = async (req, res) => {

    try {

        const staff =
            await StaffService.getStaffById(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            data: staff
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const updateStaff = async (req, res) => {

    try {

        const staff =
            await StaffService.updateStaff(
                req.params.id,
                req.body,
                req.file
            );

        return res.status(200).json({
            success: true,
            message: "Staff updated successfully",
            data: staff
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const activateStaff = async (req, res) => {

    try {

        const staff =
            await StaffService.activateStaff(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message: "Staff activated successfully",
            data: staff
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deactivateStaff = async (req, res) => {

    try {

        const staff =
            await StaffService.deactivateStaff(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message: "Staff deactivated successfully",
            data: staff
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteStaff = async (req, res) => {

    try {

        const result =
            await StaffService.deleteStaff(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    createStaff,
    getAllStaff,
    getStaffById,
    updateStaff,
    activateStaff,
    deactivateStaff,
    deleteStaff
};
