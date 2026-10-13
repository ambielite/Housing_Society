
const { Op } = require("sequelize");

const CommunityGroup = require("./group.model");
const groupRepository = require("./group.repository");

const Society = require("../../../modules/societies/society/society.model");

const createGroup = async (data) => {

    if (!data.societyId) {
        throw new Error("societyId is required");
    }

    if (!data.name || data.name.trim() === "") {
        throw new Error("Group name is required");
    }

    const society = await Society.findByPk(data.societyId);

    if (!society) {
        throw new Error("Society not found");
    }

    const existingGroup = await groupRepository.findOne({
        societyId: data.societyId,
        name: data.name.trim()
    });

    if (existingGroup) {
        throw new Error("A group with this name already exists in this society");
    }

    return await groupRepository.create({
        ...data,
        name: data.name.trim()
    });
};


const getGroups = async (filters = {}) => {

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

    return await groupRepository.findAll(where);
};


const getGroupById = async (id) => {

    const group = await groupRepository.findById(id);

    if (!group) {
        throw new Error("Community group not found");
    }

    return group;
};


const updateGroup = async (id, data) => {

    const group = await groupRepository.findById(id);

    if (!group) {
        throw new Error("Community group not found");
    }

    if (data.societyId) {

        const society = await Society.findByPk(data.societyId);

        if (!society) {
            throw new Error("Society not found");
        }
    }

    if (data.name) {

        const existingGroup = await groupRepository.findOne({
            societyId: data.societyId || group.societyId,
            name: data.name.trim()
        });

        if (
            existingGroup &&
            existingGroup.id !== group.id
        ) {
            throw new Error("A group with this name already exists");
        }

        data.name = data.name.trim();
    }

    return await groupRepository.update(group, data);
};


const activateGroup = async (id) => {

    const group = await groupRepository.findById(id);

    if (!group) {
        throw new Error("Community group not found");
    }

    return await groupRepository.update(group, {
        status: "ACTIVE"
    });
};


const deactivateGroup = async (id) => {

    const group = await groupRepository.findById(id);

    if (!group) {
        throw new Error("Community group not found");
    }

    return await groupRepository.update(group, {
        status: "INACTIVE"
    });
};


const deleteGroup = async (id) => {

    const group = await groupRepository.findById(id);

    if (!group) {
        throw new Error("Community group not found");
    }

    await groupRepository.deleteGroup(group);

    return {
        message: "Community group deleted successfully"
    };
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

