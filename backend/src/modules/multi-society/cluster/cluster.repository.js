const Cluster = require("./cluster.model");

const create = async (data) => {
    return await Cluster.create(data);
};


const findAll = async () => {
    return await Cluster.findAll({
        order: [
            ["created_at", "DESC"]
        ]
    });
};


const findAllByOrganization = async (organizationId) => {
    return await Cluster.findAll({
        where: {
            organizationId
        },
        order: [
            ["created_at", "DESC"]
        ]
    });
};


const findById = async (id) => {
    return await Cluster.findByPk(id);
};


const findByOrganizationAndCode = async (
    organizationId,
    code
) => {

    return await Cluster.findOne({
        where: {
            organizationId,
            code
        }
    });
};


const update = async (cluster, data) => {
    return await cluster.update(data);
};


const remove = async (cluster) => {
    return await cluster.destroy();
};


module.exports = {
    create,
    findAll,
    findAllByOrganization,
    findById,
    findByOrganizationAndCode,
    update,
    remove
};