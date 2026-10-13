
const moderationService = require("./moderation.service");


const createModerationReport = async (
    req,
    res
) => {

    try {

        const report =
            await moderationService.createModerationReport(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Moderation report created successfully",
            data: report
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getModerationReports = async (
    req,
    res
) => {

    try {

        const reports =
            await moderationService.getModerationReports(
                req.query
            );

        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getModerationById = async (
    req,
    res
) => {

    try {

        const report =
            await moderationService.getModerationById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: report
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const startReview = async (
    req,
    res
) => {

    try {

        const report =
            await moderationService.startReview(
                req.params.id,
                req.body.moderatorId
            );

        res.status(200).json({
            success: true,
            message:
                "Moderation review started",
            data: report
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const applyAction = async (
    req,
    res
) => {

    try {

        const report =
            await moderationService.applyAction(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message:
                "Moderation action applied successfully",
            data: report
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const resolveReport = async (
    req,
    res
) => {

    try {

        const report =
            await moderationService.resolveReport(
                req.params.id,
                req.body.moderatorId,
                req.body.moderationNote
            );

        res.status(200).json({
            success: true,
            message:
                "Moderation report resolved",
            data: report
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const dismissReport = async (
    req,
    res
) => {

    try {

        const report =
            await moderationService.dismissReport(
                req.params.id,
                req.body.moderatorId,
                req.body.moderationNote
            );

        res.status(200).json({
            success: true,
            message:
                "Moderation report dismissed",
            data: report
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteModeration = async (
    req,
    res
) => {

    try {

        const result =
            await moderationService.deleteModeration(
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
    createModerationReport,
    getModerationReports,
    getModerationById,
    startReview,
    applyAction,
    resolveReport,
    dismissReport,
    deleteModeration
};

