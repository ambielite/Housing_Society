const residentService = require("./resident.service");


// ============================================================
// CREATE
// ============================================================

const createResident = async (req, res) => {

    try {

        const resident =
            await residentService.createResident(
                req.body
            );

        return res.status(201).json({
            success: true,
            message: "Resident created successfully",
            data: resident
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// GET ALL
// ============================================================

const getAllResidents = async (req, res) => {

    try {

        const residents =
            await residentService.getAllResidents(
                req.query
            );

        return res.status(200).json({
            success: true,
            count: residents.length,
            data: residents
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// GET BY ID
// ============================================================

const getResidentById = async (req, res) => {

    try {

        const resident =
            await residentService.getResidentById(
                req.params.id,
                req.query.societyId
            );

        return res.status(200).json({
            success: true,
            data: resident
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// UPDATE
// ============================================================

const updateResident = async (req, res) => {

    try {

        const resident =
            await residentService.updateResident(
                req.params.id,
                req.body.societyId,
                req.body
            );

        return res.status(200).json({
            success: true,
            message: "Resident updated successfully",
            data: resident
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// CHANGE STATUS
// ============================================================

const changeResidentStatus = async (req, res) => {

    try {

        const resident =
            await residentService.changeResidentStatus(
                req.params.id,
                req.body.societyId,
                req.body.status
            );

        return res.status(200).json({
            success: true,
            message: "Resident status updated successfully",
            data: resident
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// DELETE
// ============================================================

const deleteResident = async (req, res) => {

    try {

        const result =
            await residentService.deleteResident(
                req.params.id,
                req.query.societyId
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
    createResident,
    getAllResidents,
    getResidentById,
    updateResident,
    changeResidentStatus,
    deleteResident
};