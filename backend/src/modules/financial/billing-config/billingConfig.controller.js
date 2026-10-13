const service = require("./billingConfig.service");

const create = async (req, res) => {

    try {

        const config =
            await service.createConfig(req.body);

        return res.status(201).json({
            success: true,
            message:
                "Billing configuration created successfully",
            data: config
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getAll = async (req, res) => {

    try {

        const configs =
            await service.getAllConfigs(
                req.query.societyId,
                req.query.configType
            );

        return res.json({
            success: true,
            data: configs
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getById = async (req, res) => {

    try {

        const config =
            await service.getConfigById(
                req.params.id
            );

        return res.json({
            success: true,
            data: config
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

const update = async (req, res) => {

    try {

        const config =
            await service.updateConfig(
                req.params.id,
                req.body
            );

        return res.json({
            success: true,
            message:
                "Billing configuration updated successfully",
            data: config
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const remove = async (req, res) => {

    try {

        const result =
            await service.deleteConfig(
                req.params.id
            );

        return res.json({
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
    create,
    getAll,
    getById,
    update,
    remove
};