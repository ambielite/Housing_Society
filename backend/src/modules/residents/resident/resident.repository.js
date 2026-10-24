const Resident = require("./resident.model");

const create = async (data) => {

    return await Resident.create(data);
};


const findById = async (id) => {

    return await Resident.findByPk(id);
};


const findByIdAndSociety = async (id, societyId) => {

    return await Resident.findOne({
        where: {
            id,
            societyId
        }
    });
};


const findByMobile = async (societyId, mobile) => {

    return await Resident.findOne({
        where: {
            societyId,
            mobile
        }
    });
};


const findByEmail = async (societyId, email) => {
    const { Op } = require("sequelize");

    return await Resident.findOne({
        where: {
            societyId,
            email: { [Op.iLike]: String(email).trim() }
        }
    });
};


const findAll = async (where = {}) => {

    return await Resident.findAll({
        where,
        order: [
            ["createdAt", "DESC"]
        ]
    });
};


const update = async (resident, data) => {

    await resident.update(data);

    return resident;
};


const deleteResident = async (resident) => {

    await resident.destroy();

    return true;
};


module.exports = {
    create,
    findById,
    findByIdAndSociety,
    findByMobile,
    findByEmail,
    findAll,
    update,
    deleteResident
};
