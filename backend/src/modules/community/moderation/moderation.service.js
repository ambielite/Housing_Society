
const { Op } = require("sequelize");

const Society = require("../../societies/society/society.model");
const CommunityPost = require("../forum/post.model");
const CommunityComment = require("../forum/comment.model");

const moderationRepository = require("./moderation.repository");

const {
    validateCreateModeration,
    validateModerationAction,
    CONTENT_TYPES,
    PRIORITIES,
    STATUSES
} = require("./moderation.validation");


const getContent = async (
    contentType,
    contentId
) => {

    if (contentType === "POST") {

        const post = await CommunityPost.findByPk(
            contentId
        );

        if (!post) {
            throw new Error("Post not found");
        }

        return post;
    }


    if (contentType === "COMMENT") {

        const comment = await CommunityComment.findByPk(
            contentId
        );

        if (!comment) {
            throw new Error("Comment not found");
        }

        return comment;
    }

    throw new Error("Invalid content type");
};


const createModerationReport = async (data) => {

    validateCreateModeration(data);

    const society = await Society.findByPk(
        data.societyId
    );

    if (!society) {
        throw new Error("Society not found");
    }

    const content = await getContent(
        data.contentType,
        data.contentId
    );


    // Prevent duplicate active reports
    const existingReport =
        await moderationRepository.findOne({
            societyId: data.societyId,
            reporterId: data.reporterId,
            contentType: data.contentType,
            contentId: data.contentId,
            status: {
                [Op.in]: [
                    "PENDING",
                    "UNDER_REVIEW"
                ]
            }
        });


    if (existingReport) {
        throw new Error(
            "You have already reported this content"
        );
    }


    return await moderationRepository.create({
        societyId: data.societyId,
        reporterId: data.reporterId,
        contentType: data.contentType,
        contentId: data.contentId,
        reason: data.reason,
        description: data.description || null,
        priority: data.priority || "MEDIUM",
        status: "PENDING",
        action: "NONE"
    });
};


const getModerationReports = async (
    filters = {}
) => {

    const where = {};


    if (filters.societyId) {
        where.societyId = filters.societyId;
    }


    if (filters.reporterId) {
        where.reporterId = filters.reporterId;
    }


    if (filters.contentType) {

        if (!CONTENT_TYPES.includes(
            filters.contentType
        )) {
            throw new Error(
                "Invalid contentType"
            );
        }

        where.contentType = filters.contentType;
    }


    if (filters.contentId) {
        where.contentId = filters.contentId;
    }


    if (filters.status) {

        if (!STATUSES.includes(
            filters.status
        )) {
            throw new Error(
                "Invalid moderation status"
            );
        }

        where.status = filters.status;
    }


    if (filters.priority) {

        if (!PRIORITIES.includes(
            filters.priority
        )) {
            throw new Error(
                "Invalid moderation priority"
            );
        }

        where.priority = filters.priority;
    }


    if (filters.moderatorId) {
        where.moderatorId = filters.moderatorId;
    }


    return await moderationRepository.findAll(
        where
    );
};


const getModerationById = async (id) => {

    const moderation =
        await moderationRepository.findById(id);

    if (!moderation) {
        throw new Error(
            "Moderation report not found"
        );
    }

    return moderation;
};


const startReview = async (
    id,
    moderatorId
) => {

    if (!moderatorId) {
        throw new Error(
            "moderatorId is required"
        );
    }

    const moderation =
        await getModerationById(id);


    if (
        moderation.status !== "PENDING"
    ) {
        throw new Error(
            "Only pending reports can be moved to review"
        );
    }


    return await moderationRepository.update(
        moderation,
        {
            status: "UNDER_REVIEW",
            moderatorId,
            reviewedAt: new Date()
        }
    );
};


const applyAction = async (
    id,
    data
) => {

    validateModerationAction(data);


    if (!data.moderatorId) {
        throw new Error(
            "moderatorId is required"
        );
    }


    const moderation =
        await getModerationById(id);


    if (
        moderation.status === "RESOLVED" ||
        moderation.status === "DISMISSED"
    ) {
        throw new Error(
            "This moderation report is already closed"
        );
    }


    const content = await getContent(
        moderation.contentType,
        moderation.contentId
    );


    let newStatus = "RESOLVED";


    if (data.action === "DISMISS") {
        newStatus = "DISMISSED";
    }


    /*
     * Apply moderation action
     */

    if (data.action === "HIDE") {

        await content.update({
            status: "HIDDEN"
        });
    }


    if (data.action === "UNHIDE") {

        if (
            moderation.contentType === "POST"
        ) {
            await content.update({
                status: "PUBLISHED"
            });
        } else {
            await content.update({
                status: "PUBLISHED"
            });
        }
    }


    if (data.action === "DELETE") {

        await content.update({
            status: "DELETED"
        });
    }


    if (data.action === "WARN") {

        // Warning is recorded in moderation history.
        // User notification can be added later.
        newStatus = "RESOLVED";
    }


    if (data.action === "DISMISS") {
        newStatus = "DISMISSED";
    }


    return await moderationRepository.update(
        moderation,
        {
            action: data.action,
            status: newStatus,
            moderatorId: data.moderatorId,
            moderationNote:
                data.moderationNote || null,
            reviewedAt:
                moderation.reviewedAt ||
                new Date(),
            resolvedAt: new Date()
        }
    );
};


const resolveReport = async (
    id,
    moderatorId,
    moderationNote
) => {

    const moderation =
        await getModerationById(id);


    if (
        moderation.status === "RESOLVED"
    ) {
        throw new Error(
            "Report is already resolved"
        );
    }


    return await moderationRepository.update(
        moderation,
        {
            status: "RESOLVED",
            action: moderation.action || "NONE",
            moderatorId,
            moderationNote:
                moderationNote || null,
            reviewedAt:
                moderation.reviewedAt ||
                new Date(),
            resolvedAt: new Date()
        }
    );
};


const dismissReport = async (
    id,
    moderatorId,
    moderationNote
) => {

    const moderation =
        await getModerationById(id);


    if (
        moderation.status === "DISMISSED"
    ) {
        throw new Error(
            "Report is already dismissed"
        );
    }


    return await moderationRepository.update(
        moderation,
        {
            status: "DISMISSED",
            action: "DISMISS",
            moderatorId,
            moderationNote:
                moderationNote || null,
            reviewedAt:
                moderation.reviewedAt ||
                new Date(),
            resolvedAt: new Date()
        }
    );
};


const deleteModeration = async (id) => {

    const moderation =
        await getModerationById(id);


    if (
        moderation.status === "UNDER_REVIEW"
    ) {
        throw new Error(
            "Cannot delete a report under review"
        );
    }


    await moderationRepository.deleteModeration(
        moderation
    );


    return {
        message:
            "Moderation report deleted successfully"
    };
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

