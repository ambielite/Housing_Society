const Patrol =
    require("./patrol.model");

const PatrolCheckpoint =
    require("./patrolCheckpoint.model");


const create = async (data) => {

    return await Patrol.create(data);

};


const findById = async (id) => {

    return await Patrol.findByPk(id);

};


const findByCode = async (
    societyId,
    patrolCode
) => {

    return await Patrol.findOne({
        where: {
            societyId,
            patrolCode
        }
    });

};


const findAll = async (where = {}) => {

    return await Patrol.findAll({
        where,
        order: [
            ["patrolDate", "DESC"],
            ["plannedStartTime", "ASC"]
        ]
    });

};


const update = async (
    patrol,
    data
) => {

    return await patrol.update(data);

};


const remove = async (patrol) => {

    return await patrol.destroy();

};


const createCheckpoint = async (
    data
) => {

    return await PatrolCheckpoint.create(
        data
    );

};


const findPatrolCheckpoints = async (
    patrolId
) => {

    return await PatrolCheckpoint.findAll({
        where: {
            patrolId
        },
        order: [
            ["sequenceOrder", "ASC"]
        ]
    });

};


const findPatrolCheckpoint = async (
    patrolId,
    checkpointId
) => {

    return await PatrolCheckpoint.findOne({
        where: {
            patrolId,
            checkpointId
        }
    });

};


const updatePatrolCheckpoint = async (
    patrolCheckpoint,
    data
) => {

    return await patrolCheckpoint.update(
        data
    );

};


module.exports = {
    create,
    findById,
    findByCode,
    findAll,
    update,
    remove,
    createCheckpoint,
    findPatrolCheckpoints,
    findPatrolCheckpoint,
    updatePatrolCheckpoint
};