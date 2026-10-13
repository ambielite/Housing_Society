const service =
    require("./meetingActionItem.service");

const createActionItem = async (req, res) => {
    try {
        const data =
            await service.createActionItem(
                req.body
            );

        res.status(201).json({
            success: true,
            message: "Action item created successfully",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getActionItems = async (req, res) => {
    try {
        const data =
            await service.getActionItems(
                req.query
            );

        res.status(200).json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getActionItemById = async (req, res) => {
    try {
        const data =
            await service.getActionItemById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

const updateActionItem = async (req, res) => {
    try {
        const data =
            await service.updateActionItem(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Action item updated successfully",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const startActionItem = async (req, res) => {
    try {
        const data =
            await service.startActionItem(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Action item started",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const completeActionItem = async (req, res) => {
    try {
        const data =
            await service.completeActionItem(
                req.params.id,
                req.body.completionNote
            );

        res.status(200).json({
            success: true,
            message: "Action item completed",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const cancelActionItem = async (req, res) => {
    try {
        const data =
            await service.cancelActionItem(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Action item cancelled",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const deleteActionItem = async (req, res) => {
    try {
        await service.deleteActionItem(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Action item deleted successfully"
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createActionItem,
    getActionItems,
    getActionItemById,
    updateActionItem,
    startActionItem,
    completeActionItem,
    cancelActionItem,
    deleteActionItem
};