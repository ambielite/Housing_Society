const AMC = require("./amc.model");

const create = async (data) => {
    return await AMC.create(data);
};


const findAll = async (
    where = {}
) => {

    return await AMC.findAll({
        where,
        order: [
            ["endDate", "ASC"],
            ["created_at", "DESC"]
        ]
    });
};


const findById = async (id) => {
    return await AMC.findByPk(id);
};


const findByAmcNumber = async (
    societyId,
    amcNumber
) => {

    return await AMC.findOne({
        where: {
            societyId,
            amcNumber
        }
    });
};


const findByAssetId = async (
    assetId
) => {

    return await AMC.findAll({
        where: {
            assetId
        },
        order: [
            ["startDate", "DESC"]
        ]
    });
};


const update = async (
    amc,
    data
) => {

    return await amc.update(
        data
    );
};


const deleteAMC = async (
    amc
) => {

    return await amc.destroy();
};


module.exports = {
    create,
    findAll,
    findById,
    findByAmcNumber,
    findByAssetId,
    update,
    deleteAMC
};