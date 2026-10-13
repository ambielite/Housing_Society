const { Op } = require("sequelize");

const LedgerAccount = require("./ledgerAccount.model");


// ========================================
// CREATE
// ========================================

const create = async (data, transaction = null) => {

    return await LedgerAccount.create(
        data,
        {
            transaction
        }
    );
};


// ========================================
// FIND ALL
// ========================================

const findAll = async (filters = {}) => {

    const where = {};

    if (filters.societyId) {
        where.societyId = filters.societyId;
    }

    if (filters.unitId) {
        where.unitId = filters.unitId;
    }

    if (filters.memberId) {
        where.memberId = filters.memberId;
    }

    if (filters.accountId) {
        where.accountId = filters.accountId;
    }

    if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
    }

    return await LedgerAccount.findAll({
        where,
        order: [
            ["created_at", "DESC"]
        ]
    });
};


// ========================================
// FIND BY ID
// ========================================

const findById = async (id) => {

    return await LedgerAccount.findByPk(id);
};


// ========================================
// FIND BY CODE
// ========================================

const findByCode = async (
    societyId,
    ledgerCode
) => {

    return await LedgerAccount.findOne({
        where: {
            societyId,
            ledgerCode
        }
    });
};


// ========================================
// FIND BY UNIT
// ========================================

const findByUnit = async (
    societyId,
    unitId
) => {

    return await LedgerAccount.findAll({
        where: {
            societyId,
            unitId
        },

        order: [
            ["created_at", "DESC"]
        ]
    });
};


// ========================================
// FIND BY MEMBER
// ========================================

const findByMember = async (
    societyId,
    memberId
) => {

    return await LedgerAccount.findAll({
        where: {
            societyId,
            memberId
        },

        order: [
            ["created_at", "DESC"]
        ]
    });
};


// ========================================
// FIND BY UNIT + ACCOUNT
// ========================================

const findByUnitAndAccount = async (
    societyId,
    unitId,
    accountId
) => {

    return await LedgerAccount.findOne({
        where: {
            societyId,
            unitId,
            accountId
        }
    });
};


// ========================================
// UPDATE
// ========================================

const update = async (
    id,
    data,
    transaction = null
) => {

    const ledger =
        await LedgerAccount.findByPk(id);

    if (!ledger) {
        return null;
    }

    await ledger.update(
        data,
        {
            transaction
        }
    );

    return ledger;
};


// ========================================
// DELETE
// ========================================

const deleteById = async (
    id,
    transaction = null
) => {

    return await LedgerAccount.destroy({
        where: {
            id
        },
        transaction
    });
};


module.exports = {
    create,
    findAll,
    findById,
    findByCode,
    findByUnit,
    findByMember,
    findByUnitAndAccount,
    update,
    deleteById
};