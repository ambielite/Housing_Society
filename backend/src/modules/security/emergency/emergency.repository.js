const Emergency = require("./emergency.model");


const create = async (data) => {
    return await Emergency.create(data);
};


const findAll = async (where = {}) => {

    return await Emergency.findAll({
        where,

        order: [
            ["reportedAt", "DESC"],
            ["createdAt", "DESC"]
        ]
    });
};


const findById = async (id) => {

    return await Emergency.findByPk(id);
};


const findOne = async (where) => {

    return await Emergency.findOne({
        where
    });
};


const update = async (emergency, data) => {

    return await emergency.update(data);
};


const deleteEmergency = async (emergency) => {

    return await emergency.destroy();
};


module.exports = {
    create,
    findAll,
    findById,
    findOne,
    update,
    deleteEmergency
};