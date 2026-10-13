
const CommunityGroup = require("./group.model");
const memberRepository = require("./groupMember.repository");

const createMember = async (groupId, data) => {

    if (!data.userId) {
        throw new Error("userId is required");
    }

    const group = await CommunityGroup.findByPk(groupId);

    if (!group) {
        throw new Error("Community group not found");
    }

    if (group.status !== "ACTIVE") {
        throw new Error("Cannot add member to an inactive group");
    }

    const existingMember = await memberRepository.findOne({
        groupId,
        userId: data.userId
    });

    if (existingMember) {
        throw new Error("User is already associated with this group");
    }

    const role = data.role || "MEMBER";

    if (!["ADMIN", "MODERATOR", "MEMBER"].includes(role)) {
        throw new Error("Invalid member role");
    }

    const status = data.status || "ACTIVE";

    if (!["PENDING", "ACTIVE", "REMOVED"].includes(status)) {
        throw new Error("Invalid member status");
    }

    return await memberRepository.create({
        groupId,
        userId: data.userId,
        role,
        status,
        joinedAt: status === "ACTIVE" ? new Date() : null,
        removedAt: status === "REMOVED" ? new Date() : null
    });
};


const getMembers = async (groupId, filters = {}) => {

    const group = await CommunityGroup.findByPk(groupId);

    if (!group) {
        throw new Error("Community group not found");
    }

    const where = {
        groupId
    };

    if (filters.userId) {
        where.userId = filters.userId;
    }

    if (filters.role) {
        where.role = filters.role;
    }

    if (filters.status) {
        where.status = filters.status;
    }

    return await memberRepository.findAll(where);
};


const getMemberById = async (groupId, memberId) => {

    const member = await memberRepository.findById(memberId);

    if (!member || member.groupId !== groupId) {
        throw new Error("Group member not found");
    }

    return member;
};


const updateMember = async (groupId, memberId, data) => {

    const member = await getMemberById(
        groupId,
        memberId
    );

    if (data.role) {

        if (!["ADMIN", "MODERATOR", "MEMBER"].includes(data.role)) {
            throw new Error("Invalid member role");
        }
    }

    if (data.status) {

        if (!["PENDING", "ACTIVE", "REMOVED"].includes(data.status)) {
            throw new Error("Invalid member status");
        }

        if (data.status === "ACTIVE" && !member.joinedAt) {
            data.joinedAt = new Date();
        }

        if (data.status === "REMOVED") {
            data.removedAt = new Date();
        }
    }

    return await memberRepository.update(member, data);
};


const removeMember = async (groupId, memberId) => {

    const member = await getMemberById(
        groupId,
        memberId
    );

    return await memberRepository.update(member, {
        status: "REMOVED",
        removedAt: new Date()
    });
};


const deleteMember = async (groupId, memberId) => {

    const member = await getMemberById(
        groupId,
        memberId
    );

    await memberRepository.deleteMember(member);

    return {
        message: "Group member deleted successfully"
    };
};


module.exports = {
    createMember,
    getMembers,
    getMemberById,
    updateMember,
    removeMember,
    deleteMember
};

