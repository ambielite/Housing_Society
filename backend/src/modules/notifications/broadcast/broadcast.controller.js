
const broadcastService =
    require("./broadcast.service");


// ============================================================
// CREATE
// ============================================================

const createBroadcast = async (
    req,
    res
) => {

    try {

        const broadcast =
            await broadcastService.createBroadcast(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Broadcast created successfully",
            data: broadcast
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// GET ALL
// ============================================================

const getAllBroadcasts = async (
    req,
    res
) => {

    try {

        const broadcasts =
            await broadcastService.getAllBroadcasts(
                req.query
            );

        res.status(200).json({
            success: true,
            count: broadcasts.length,
            data: broadcasts
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// GET BY ID
// ============================================================

const getBroadcastById = async (
    req,
    res
) => {

    try {

        const broadcast =
            await broadcastService.getBroadcastById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: broadcast
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// UPDATE
// ============================================================

const updateBroadcast = async (
    req,
    res
) => {

    try {

        const broadcast =
            await broadcastService.updateBroadcast(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message:
                "Broadcast updated successfully",
            data: broadcast
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// SCHEDULE
// ============================================================

const scheduleBroadcast = async (
    req,
    res
) => {

    try {

        const broadcast =
            await broadcastService.scheduleBroadcast(
                req.params.id,
                req.body.scheduledAt
            );

        res.status(200).json({
            success: true,
            message:
                "Broadcast scheduled successfully",
            data: broadcast
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// START SENDING
// ============================================================

const startBroadcast = async (
    req,
    res
) => {

    try {

        const broadcast =
            await broadcastService.startBroadcast(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Broadcast sending started",
            data: broadcast
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// MARK SENT
// ============================================================

const markAsSent = async (
    req,
    res
) => {

    try {

        const broadcast =
            await broadcastService.markAsSent(
                req.params.id,
                req.body.recipientCount
            );

        res.status(200).json({
            success: true,
            message:
                "Broadcast marked as sent",
            data: broadcast
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// CANCEL
// ============================================================

const cancelBroadcast = async (
    req,
    res
) => {

    try {

        const broadcast =
            await broadcastService.cancelBroadcast(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Broadcast cancelled successfully",
            data: broadcast
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// DELETE
// ============================================================

const deleteBroadcast = async (
    req,
    res
) => {

    try {

        await broadcastService.deleteBroadcast(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message:
                "Broadcast deleted successfully"
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    createBroadcast,
    getAllBroadcasts,
    getBroadcastById,
    updateBroadcast,
    scheduleBroadcast,
    startBroadcast,
    markAsSent,
    cancelBroadcast,
    deleteBroadcast
};
