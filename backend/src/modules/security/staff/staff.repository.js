const Staff = require("./staff.model");

const create = async (data) => {
    return await Staff.create(data);
};

const findById = async (id) => {
    return await Staff.findByPk(id);
};

const findByEmployeeCode = async (
    societyId,
    employeeCode
) => {
    return await Staff.findOne({
        where: {
            societyId,
            employeeCode
        }
    });
};

const findAll = async (where = {}) => {
    return await Staff.findAll({
        where,
        order: [
            ["created_at", "DESC"]
        ]
    });
};

const update = async (staff, data) => {
    return await staff.update(data);
};

const remove = async (staff) => {
    return await staff.destroy();
};

module.exports = {
    create,
    findById,
    findByEmployeeCode,
    findAll,
    update,
    remove
};