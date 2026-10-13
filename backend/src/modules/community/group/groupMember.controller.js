
const memberService = require("./groupMember.service");

const createMember = async (req, res) => {

    try {

        const member = await memberService.createMember(
            req.params.groupId,
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Member added to group successfully",
            data: member
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getMembers = async (req, res) => {

    try {

        const members = await memberService.getMembers(
            req.params.groupId,
            req.query
        );

        res.status(200).json({
            success: true,
            count: members.length,
            data: members
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getMemberById = async (req, res) => {

    try {

        const member = await memberService.getMemberById(
            req.params.groupId,
            req.params.memberId
        );

        res.status(200).json({
            success: true,
            data: member
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const updateMember = async (req, res) => {

    try {

        const member = await memberService.updateMember(
            req.params.groupId,
            req.params.memberId,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Group member updated successfully",
            data: member
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const removeMember = async (req, res) => {

    try {

        const member = await memberService.removeMember(
            req.params.groupId,
            req.params.memberId
        );

        res.status(200).json({
            success: true,
            message: "Member removed from group successfully",
            data: member
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteMember = async (req, res) => {

    try {

        const result = await memberService.deleteMember(
            req.params.groupId,
            req.params.memberId
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
    createMember,
    getMembers,
    getMemberById,
    updateMember,
    removeMember,
    deleteMember
};

