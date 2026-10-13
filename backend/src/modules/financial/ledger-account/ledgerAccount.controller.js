const service =
    require("./ledgerAccount.service");


// ========================================
// CREATE
// ========================================

const create = async (req, res) => {

    try {

        const ledger =
            await service.createLedgerAccount(
                req.body
            );

        return res.status(201).json({
            success: true,
            message:
                "Ledger account created successfully",
            data: ledger
        });

    } catch (error) {

        console.error(
            "Create ledger account error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ========================================
// GET ALL
// ========================================

const getAll = async (req, res) => {

    try {

        const filters = {
            societyId:
                req.query.societyId,

            unitId:
                req.query.unitId,

            memberId:
                req.query.memberId,

            accountId:
                req.query.accountId,

            isActive:
                req.query.isActive !== undefined
                    ? req.query.isActive === "true"
                    : undefined
        };


        const ledgers =
            await service.getAll(filters);


        return res.status(200).json({
            success: true,
            data: ledgers
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ========================================
// GET BY UNIT
// ========================================

const getByUnit = async (req, res) => {

    try {

        const ledgers =
            await service.getByUnit(
                req.params.societyId,
                req.params.unitId
            );

        return res.status(200).json({
            success: true,
            data: ledgers
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ========================================
// GET BY MEMBER
// ========================================

const getByMember = async (req, res) => {

    try {

        const ledgers =
            await service.getByMember(
                req.params.societyId,
                req.params.memberId
            );

        return res.status(200).json({
            success: true,
            data: ledgers
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ========================================
// GET BY ID
// ========================================

const getById = async (req, res) => {

    try {

        const ledger =
            await service.getById(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            data: ledger
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


// ========================================
// UPDATE
// ========================================

const update = async (req, res) => {

    try {

        const ledger =
            await service.update(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message:
                "Ledger account updated successfully",
            data: ledger
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ========================================
// ACTIVATE
// ========================================

const activate = async (req, res) => {

    try {

        const ledger =
            await service.activate(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message:
                "Ledger account activated successfully",
            data: ledger
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ========================================
// DEACTIVATE
// ========================================

const deactivate = async (req, res) => {

    try {

        const ledger =
            await service.deactivate(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message:
                "Ledger account deactivated successfully",
            data: ledger
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ========================================
// DELETE
// ========================================

const remove = async (req, res) => {

    try {

        await service.deleteLedgerAccount(
            req.params.id
        );

        return res.status(200).json({
            success: true,
            message:
                "Ledger account deleted successfully"
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    create,
    getAll,
    getByUnit,
    getByMember,
    getById,
    update,
    activate,
    deactivate,
    remove
};