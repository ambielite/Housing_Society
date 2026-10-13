const { Op } = require("sequelize");

const Account = require("./account.model");


const create = async (data) => {

    return await Account.create(data);
};


const findAll = async (societyId) => {

    const where = {};

    if (societyId) {
        where.societyId = societyId;
    }

    return await Account.findAll({
        where,
        order: [
            ["accountCode", "ASC"]
        ]
    });
};


const findById = async (id) => {

    return await Account.findByPk(id);
};


const findByCode = async (
    societyId,
    accountCode
) => {

    return await Account.findOne({
        where: {
            societyId,
            accountCode
        }
    });
};


const findByName = async (
    societyId,
    accountName
) => {

    return await Account.findOne({
        where: {
            societyId,
            accountName
        }
    });
};


const findChildren = async (
    parentAccountId
) => {

    return await Account.findAll({
        where: {
            parentAccountId
        },
        order: [
            ["accountCode", "ASC"]
        ]
    });
};


const findByType = async (
    societyId,
    accountType
) => {

    return await Account.findAll({
        where: {
            societyId,
            accountType
        },
        order: [
            ["accountCode", "ASC"]
        ]
    });
};


const update = async (
    id,
    data
) => {

    const account =
        await Account.findByPk(id);

    if (!account) {
        return null;
    }

    await account.update(data);

    return account;
};


const deleteById = async (id) => {

    const account =
        await Account.findByPk(id);

    if (!account) {
        return null;
    }

    await account.destroy();

    return account;
};


module.exports = {

    create,

    findAll,

    findById,

    findByCode,

    findByName,

    findChildren,

    findByType,

    update,

    deleteById
};