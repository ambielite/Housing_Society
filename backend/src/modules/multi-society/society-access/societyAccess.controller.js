const service = require("./societyAccess.service");


// CREATE ACCESS
const createAccess = async (req, res) => {

    try {

        const result =
            await service.createAccess(req.body);

        return res.status(201).json({
            success: true,
            message:
                "Society access created successfully",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// GET USER SOCIETIES
const getUserSocieties = async (req, res) => {

    try {

        const result =
            await service.getUserSocieties(
                req.params.userId
            );

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// GET DEFAULT SOCIETY
const getDefaultSociety = async (req, res) => {

    try {

        const result =
            await service.getDefaultSociety(
                req.params.userId
            );

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// SWITCH SOCIETY
const switchSociety = async (req, res) => {

    try {

        const {
            userId,
            societyId
        } = req.body;

        const result =
            await service.switchSociety(
                userId,
                societyId
            );

        return res.status(200).json({
            success: true,
            message:
                "Society switched successfully",
            data: result
        });

    } catch (error) {

        return res.status(403).json({
            success: false,
            message: error.message
        });
    }
};


// UPDATE ACCESS
const updateAccess = async (req, res) => {

    try {

        const result =
            await service.updateAccess(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message:
                "Society access updated successfully",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// DELETE ACCESS
const removeAccess = async (req, res) => {

    try {

        const result =
            await service.removeAccess(
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
    createAccess,
    getUserSocieties,
    getDefaultSociety,
    switchSociety,
    updateAccess,
    removeAccess
};