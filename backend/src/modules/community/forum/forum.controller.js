
const forumService = require("./forum.service");

const createForum = async (req, res) => {

    try {

        const forum = await forumService.createForum(
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Forum created successfully",
            data: forum
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getForums = async (req, res) => {

    try {

        const forums = await forumService.getForums(
            req.query
        );

        res.status(200).json({
            success: true,
            count: forums.length,
            data: forums
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getForumById = async (req, res) => {

    try {

        const forum = await forumService.getForumById(
            req.params.id
        );

        res.status(200).json({
            success: true,
            data: forum
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const updateForum = async (req, res) => {

    try {

        const forum = await forumService.updateForum(
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Forum updated successfully",
            data: forum
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const activateForum = async (req, res) => {

    try {

        const forum = await forumService.activateForum(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Forum activated successfully",
            data: forum
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deactivateForum = async (req, res) => {

    try {

        const forum = await forumService.deactivateForum(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Forum deactivated successfully",
            data: forum
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteForum = async (req, res) => {

    try {

        const result = await forumService.deleteForum(
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
    createForum,
    getForums,
    getForumById,
    updateForum,
    activateForum,
    deactivateForum,
    deleteForum
};

