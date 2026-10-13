const StaffTask = require("./staffTask.model");


const create = async (data) => {

    return await StaffTask.create(data);

};


const findById = async (id) => {

    return await StaffTask.findByPk(id);

};


const findAll = async (where = {}) => {

    return await StaffTask.findAll({
        where,
        order: [
            ["createdAt", "DESC"]
        ]
    });

};


const findByStaffId = async (staffId) => {

    return await StaffTask.findAll({
        where: {
            staffId
        },
        order: [
            ["createdAt", "DESC"]
        ]
    });

};


const update = async (task, data) => {

    return await task.update(data);

};


const remove = async (task) => {

    return await task.destroy();

};


module.exports = {
    create,
    findById,
    findAll,
    findByStaffId,
    update,
    remove
};