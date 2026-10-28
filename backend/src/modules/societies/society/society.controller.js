const societyService = require("./society.service");


const createSociety = async (req, res, next) => {
    try {
        const society =
            await societyService.createSociety(req.body, req.user?.id, req.file);

        res.status(201).json({
            success: true,
            message: "Society created successfully",
            data: society
        });
    } catch (error) {
        next(error);
    }
};


const getAllSocieties = async (req, res, next) => {
    try {
        const societies =
            await societyService.getAllSocieties(req.user);

        res.status(200).json({
            success: true,
            count: societies.length,
            data: societies
        });
    } catch (error) {
        next(error);
    }
};


const getSocietyById = async (req, res, next) => {
    try {
        const society =
            await societyService.getSocietyById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: society
        });
    } catch (error) {
        next(error);
    }
};


const updateSociety = async (req, res, next) => {
    try {
        const society =
            await societyService.updateSociety(
                req.params.id,
                req.body,
                req.file
            );

        res.status(200).json({
            success: true,
            message: "Society updated successfully",
            data: society
        });
    } catch (error) {
        next(error);
    }
};


const deleteSociety = async (req, res, next) => {
    try {
        const society =
            await societyService.deleteSociety(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Society deleted successfully",
            data: society
        });
    } catch (error) {
        next(error);
    }
};


module.exports = {
    createSociety,
    getAllSocieties,
    getSocietyById,
    updateSociety,
    deleteSociety
};
