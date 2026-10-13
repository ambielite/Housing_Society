const { Op } = require("sequelize");

const Society = require("../../../modules/societies/society/society.model");

const repository = require("./classified.repository");

const {
    validateCreateClassified,
    validateUpdateClassified,
    validateApproval,
    validateRejection
} = require("./classified.validation");


const createClassified = async (data) => {

    validateCreateClassified(data);

    const society = await Society.findByPk(data.societyId);

    if (!society) {
        throw new Error("Society not found");
    }

    const classified = await repository.create({
        ...data,
        status: "DRAFT"
    });

    return classified;
};


const getClassifieds = async (filters = {}) => {

    const where = {};

    if (filters.societyId) {
        where.societyId = filters.societyId;
    }

    if (filters.sellerId) {
        where.sellerId = filters.sellerId;
    }

    if (filters.category) {
        where.category = filters.category;
    }

    if (filters.status) {
        where.status = filters.status;
    }

    if (filters.search) {

        where[Op.or] = [
            {
                title: {
                    [Op.iLike]: `%${filters.search}%`
                }
            },
            {
                description: {
                    [Op.iLike]: `%${filters.search}%`
                }
            }
        ];
    }

    return await repository.findAll(where);
};


const getClassifiedById = async (id) => {

    const classified = await repository.findById(id);

    if (!classified) {
        throw new Error("Classified listing not found");
    }

    return classified;
};


const updateClassified = async (id, data) => {

    validateUpdateClassified(data);

    const classified = await getClassifiedById(id);

    if (
        classified.status === "PUBLISHED" ||
        classified.status === "SOLD" ||
        classified.status === "REMOVED"
    ) {
        throw new Error(
            "Published, sold or removed listings cannot be updated"
        );
    }

    return await repository.update(
        classified,
        data
    );
};


const submitForApproval = async (id) => {

    const classified = await getClassifiedById(id);

    if (
        classified.status !== "DRAFT" &&
        classified.status !== "REJECTED"
    ) {
        throw new Error(
            "Only draft or rejected listings can be submitted"
        );
    }

    return await repository.update(
        classified,
        {
            status: "PENDING_APPROVAL"
        }
    );
};


const approveClassified = async (id, data) => {

    validateApproval(data);

    const classified = await getClassifiedById(id);

    if (classified.status !== "PENDING_APPROVAL") {
        throw new Error(
            "Only pending listings can be approved"
        );
    }

    return await repository.update(
        classified,
        {
            status: "APPROVED",
            approvedBy: data.moderatorId,
            approvedAt: new Date(),
            rejectedBy: null,
            rejectedAt: null,
            moderationNote: null
        }
    );
};


const rejectClassified = async (id, data) => {

    validateRejection(data);

    const classified = await getClassifiedById(id);

    if (classified.status !== "PENDING_APPROVAL") {
        throw new Error(
            "Only pending listings can be rejected"
        );
    }

    return await repository.update(
        classified,
        {
            status: "REJECTED",
            rejectedBy: data.moderatorId,
            rejectedAt: new Date(),
            moderationNote: data.moderationNote
        }
    );
};


const publishClassified = async (id) => {

    const classified = await getClassifiedById(id);

    if (classified.status !== "APPROVED") {
        throw new Error(
            "Only approved listings can be published"
        );
    }

    return await repository.update(
        classified,
        {
            status: "PUBLISHED"
        }
    );
};


const markAsSold = async (id) => {

    const classified = await getClassifiedById(id);

    if (classified.status !== "PUBLISHED") {
        throw new Error(
            "Only published listings can be marked as sold"
        );
    }

    return await repository.update(
        classified,
        {
            status: "SOLD",
            soldAt: new Date()
        }
    );
};


const removeClassified = async (id) => {

    const classified = await getClassifiedById(id);

    if (
        classified.status === "REMOVED" ||
        classified.status === "SOLD"
    ) {
        throw new Error(
            "Listing cannot be removed"
        );
    }

    return await repository.update(
        classified,
        {
            status: "REMOVED",
            removedAt: new Date()
        }
    );
};


const expireClassified = async (id) => {

    const classified = await getClassifiedById(id);

    if (
        classified.status !== "PUBLISHED" &&
        classified.status !== "APPROVED"
    ) {
        throw new Error(
            "Only active listings can expire"
        );
    }

    return await repository.update(
        classified,
        {
            status: "EXPIRED"
        }
    );
};


const deleteClassified = async (id) => {

    const classified = await getClassifiedById(id);

    if (
        classified.status === "PUBLISHED" ||
        classified.status === "SOLD"
    ) {
        throw new Error(
            "Published or sold listings cannot be deleted"
        );
    }

    return await repository.deleteClassified(
        classified
    );
};


module.exports = {
    createClassified,
    getClassifieds,
    getClassifiedById,
    updateClassified,
    submitForApproval,
    approveClassified,
    rejectClassified,
    publishClassified,
    markAsSold,
    removeClassified,
    expireClassified,
    deleteClassified
};