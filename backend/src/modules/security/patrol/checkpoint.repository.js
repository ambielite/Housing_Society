const Checkpoint =
    require("./checkpoint.model");


const create = async (data) => {

    return await Checkpoint.create(data);

};


const findById = async (id) => {

    return await Checkpoint.findByPk(id);

};


const findByCode = async (
    societyId,
    checkpointCode
) => {

    return await Checkpoint.findOne({
        where: {
            societyId,
            checkpointCode
        }
    });

};


const findAll = async (where = {}) => {

    return await Checkpoint.findAll({
        where,
        order: [
            ["sequenceOrder", "ASC"],
            ["checkpointName", "ASC"]
        ]
    });

};


const update = async (
    checkpoint,
    data
) => {

    return await checkpoint.update(data);

};


const remove = async (checkpoint) => {

    return await checkpoint.destroy();

};


module.exports = {
    create,
    findById,
    findByCode,
    findAll,
    update,
    remove
};