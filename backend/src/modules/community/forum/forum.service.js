
const { Op } = require("sequelize");

const Society = require("../../societies/society/society.model");
const forumRepository = require("./forum.repository");

const createForum = async (data) => {

    if (!data.societyId) {
        throw new Error("societyId is required");
    }

    if (!data.name || data.name.trim() === "") {
        throw new Error("Forum name is required");
    }

    const society = await Society.findByPk(data.societyId);

    if (!society) {
        throw new Error("Society not found");
    }

    const existingForum = await forumRepository.findOne({
        societyId: data.societyId,
        name: data.name.trim()
    });

    if (existingForum) {
        throw new Error(
            "A forum with this name already exists in this society"
        );
    }

    return await forumRepository.create({
        ...data,
        name: data.name.trim()
    });
};


const getForums = async (filters = {}) => {

    const where = {};

    if (filters.societyId) {
        where.societyId = filters.societyId;
    }

    if (filters.category) {
        where.category = filters.category;
    }

    if (filters.status) {
        where.status = filters.status;
    }

    if (filters.visibility) {
        where.visibility = filters.visibility;
    }

    if (filters.search) {
        where.name = {
            [Op.iLike]: `%${filters.search}%`
        };
    }

    return await forumRepository.findAll(where);
};


const getForumById = async (id) => {

    const forum = await forumRepository.findById(id);

    if (!forum) {
        throw new Error("Forum not found");
    }

    return forum;
};


const updateForum = async (id, data) => {

    const forum = await forumRepository.findById(id);

    if (!forum) {
        throw new Error("Forum not found");
    }

    if (data.societyId) {

        const society = await Society.findByPk(
            data.societyId
        );

        if (!society) {
            throw new Error("Society not found");
        }
    }

    if (data.name) {

        const existingForum = await forumRepository.findOne({
            societyId: data.societyId || forum.societyId,
            name: data.name.trim()
        });

        if (
            existingForum &&
            existingForum.id !== forum.id
        ) {
            throw new Error(
                "A forum with this name already exists"
            );
        }

        data.name = data.name.trim();
    }

    return await forumRepository.update(
        forum,
        data
    );
};


const activateForum = async (id) => {

    const forum = await forumRepository.findById(id);

    if (!forum) {
        throw new Error("Forum not found");
    }

    return await forumRepository.update(
        forum,
        { status: "ACTIVE" }
    );
};


const deactivateForum = async (id) => {

    const forum = await forumRepository.findById(id);

    if (!forum) {
        throw new Error("Forum not found");
    }

    return await forumRepository.update(
        forum,
        { status: "INACTIVE" }
    );
};


const deleteForum = async (id) => {

    const forum = await forumRepository.findById(id);

    if (!forum) {
        throw new Error("Forum not found");
    }

    await forumRepository.deleteForum(forum);

    return {
        message: "Forum deleted successfully"
    };
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

