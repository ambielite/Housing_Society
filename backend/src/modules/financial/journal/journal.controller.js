const service = require("./journal.service");


// ========================================
// CREATE JOURNAL DRAFT
// ========================================

const createDraftJournal = async (req, res) => {

    try {

        const journal =
            await service.createDraftJournal(req.body);

        return res.status(201).json({
            success: true,
            message: "Journal draft created successfully",
            data: journal
        });

    } catch (error) {

        console.error("Create journal error:", error);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ========================================
// GET ALL JOURNALS
// ========================================

const getAll = async (req, res) => {

    try {

        const journals =
            await service.getAll({ societyId: req.query.societyId });

        return res.status(200).json({
            success: true,
            data: journals
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ========================================
// GET JOURNAL BY ID
// ========================================

const getById = async (req, res) => {

    try {

        const journal =
            await service.getById(req.params.id);

        return res.status(200).json({
            success: true,
            data: journal
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


// ========================================
// GET BY ACCOUNTING PERIOD
// ========================================

const getByPeriod = async (req, res) => {

    try {

        const journals =
            await service.getByPeriod(
                req.params.accountingPeriodId
            );

        return res.status(200).json({
            success: true,
            data: journals
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ========================================
// GET BY SOCIETY + STATUS
// ========================================

const getByStatus = async (req, res) => {

    try {

        const journals =
            await service.getByStatus(
                req.params.societyId,
                req.params.status
            );

        return res.status(200).json({
            success: true,
            data: journals
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ========================================
// DELETE DRAFT
// ========================================

const removeDraft = async (req, res) => {

    try {

        await service.deleteDraft(
            req.params.id
        );

        return res.status(200).json({
            success: true,
            message: "Journal draft deleted successfully"
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ========================================
// EXPORT
// ========================================

module.exports = {

    createDraftJournal,
    getAll,
    getById,
    getByPeriod,
    getByStatus,
    removeDraft

};
