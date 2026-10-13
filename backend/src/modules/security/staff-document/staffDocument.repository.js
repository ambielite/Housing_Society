const StaffDocument =
    require("./staffDocument.model");


const create = async (data) => {

    return await StaffDocument.create(data);
};


const findById = async (id) => {

    return await StaffDocument.findByPk(id);
};


const findByStaffId = async (staffId) => {

    return await StaffDocument.findAll({
        where: {
            staffId
        },
        order: [
            ["createdAt", "DESC"]
        ]
    });
};


const findAll = async (where = {}) => {

    return await StaffDocument.findAll({
        where,
        order: [
            ["createdAt", "DESC"]
        ]
    });
};


const update = async (document, data) => {

    return await document.update(data);
};


const remove = async (document) => {

    return await document.destroy();
};


module.exports = {
    create,
    findById,
    findByStaffId,
    findAll,
    update,
    remove
};