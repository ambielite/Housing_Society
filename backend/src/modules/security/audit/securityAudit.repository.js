const SecurityAudit =
    require("./securityAudit.model");


const create = async (data) => {

    return await SecurityAudit.create(data);
};


const findAll = async (
    where = {},
    options = {}
) => {

    return await SecurityAudit.findAll({
        where,

        limit: options.limit,

        offset: options.offset,

        order: [
            ["createdAt", "DESC"]
        ]
    });
};


const count = async (where = {}) => {

    return await SecurityAudit.count({
        where
    });
};


const findById = async (id) => {

    return await SecurityAudit.findByPk(id);
};


const deleteAudit = async (audit) => {

    return await audit.destroy();
};


module.exports = {
    create,
    findAll,
    count,
    findById,
    deleteAudit
};