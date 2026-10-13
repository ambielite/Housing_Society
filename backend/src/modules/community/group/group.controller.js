
const groupService = require("./group.service");

const createGroup = async (req, res) => {

    try {

        const group = await groupService.createGroup(
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Community group created successfully",
            data: group
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getGroups = async (req, res) => {

    try {

        const groups = await groupService.getGroups(
            req.query
        );

        res.status(200).json({
            success: true,
            count: groups.length,
            data: groups
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getGroupById = async (req, res) => {

    try {

        const group = await groupService.getGroupById(
            req.params.id
        );

        res.status(200).json({
            success: true,
            data: group
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const updateGroup = async (req, res) => {

    try {

        const group = await groupService.updateGroup(
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Community group updated successfully",
            data: group
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const activateGroup = async (req, res) => {

    try {

        const group = await groupService.activateGroup(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Community group activated successfully",
            data: group
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deactivateGroup = async (req, res) => {

    try {

        const group = await groupService.deactivateGroup(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Community group deactivated successfully",
            data: group
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteGroup = async (req, res) => {

    try {

        const result = await groupService.deleteGroup(
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
    createGroup,
    getGroups,
    getGroupById,
    updateGroup,
    activateGroup,
    deactivateGroup,
    deleteGroup
};

