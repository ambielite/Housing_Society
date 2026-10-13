const Incident = require("./incident.model");

const create = async (data) => {
    return await Incident.create(data);
};

const findAll = async (where = {}) => {
    return await Incident.findAll({
        where,
        order: [
            ["incidentDate", "DESC"],
            ["createdAt", "DESC"]
        ]
    });
};

const findById = async (id) => {
    return await Incident.findByPk(id);
};

const findOne = async (where) => {
    return await Incident.findOne({
        where
    });
};

const update = async (incident, data) => {
    return await incident.update(data);
};

const deleteIncident = async (incident) => {
    return await incident.destroy();
};

module.exports = {
    create,
    findAll,
    findById,
    findOne,
    update,
    deleteIncident
};