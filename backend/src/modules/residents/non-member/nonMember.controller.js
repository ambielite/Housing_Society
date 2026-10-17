const service = require("./nonMember.service");

const create = async (req, res) => {
    try {
        const nonMember =
            await service.createNonMember(req.body);

        return res.status(201).json({
            success: true,
            message: "Non-member created successfully",
            data: nonMember
        });
    } catch (error) {
        console.error("Create non-member error:", error);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getAll = async (req, res) => {
    try {
        const filters = {};

        if (req.query.societyId) {
            filters.societyId = req.query.societyId;
        }

        if (req.query.memberType) {
            filters.memberType = req.query.memberType;
        }

        if (req.query.status) {
            filters.status = req.query.status;
        }

        if (req.query.unitId) {
            filters.unitId = req.query.unitId;
        }

        const records = await service.getAll(filters);

        return res.status(200).json({
            success: true,
            count: records.length,
            data: records
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getBySociety = async (req, res) => {
    try {
        const records =
            await service.getBySociety(
                req.params.societyId
            );

        return res.status(200).json({
            success: true,
            count: records.length,
            data: records
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getById = async (req, res) => {
    try {
        const nonMember =
            await service.getById(req.params.id);

        return res.status(200).json({
            success: true,
            data: nonMember
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

const update = async (req, res) => {
    try {
        const nonMember =
            await service.updateNonMember(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message: "Non-member updated successfully",
            data: nonMember
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const updateStatus = async (req, res) => {
    try {
        const nonMember =
            await service.updateStatus(
                req.params.id,
                req.body.status,
                req.body.remarks
            );

        return res.status(200).json({
            success: true,
            message: "Non-member status updated successfully",
            data: nonMember
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const approve = async (req, res) => {
    try {
        const nonMember =
            await service.approve(
                req.params.id,
                req.user.id,
                req.body.remarks
            );

        return res.status(200).json({
            success: true,
            message: "Non-member approved successfully",
            data: nonMember
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const search = async (req, res) => {
    try {
        const records =
            await service.search(
                req.params.societyId,
                req.query.q
            );

        return res.status(200).json({
            success: true,
            count: records.length,
            data: records
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const remove = async (req, res) => {
    try {
        await service.deleteNonMember(
            req.params.id
        );

        return res.status(200).json({
            success: true,
            message: "Non-member deleted successfully"
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    create,
    getAll,
    getBySociety,
    getById,
    update,
    updateStatus,
    approve,
    search,
    remove
};
