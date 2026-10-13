const StaffUnit =
    require("./staffUnit.model");

const create = async (data) => {

    return await StaffUnit.create(data);
};

const findById = async (id) => {

    return await StaffUnit.findByPk(id);
};

const findByStaffId = async (staffId) => {

    return await StaffUnit.findAll({
        where: {
            staffId
        },
        order: [
            ["startDate", "DESC"]
        ]
    });
};

const findByUnitId = async (unitId) => {

    return await StaffUnit.findAll({
        where: {
            unitId
        },
        order: [
            ["startDate", "DESC"]
        ]
    });
};

const findActiveByStaffAndUnit = async (
    staffId,
    unitId
) => {

    return await StaffUnit.findOne({
        where: {
            staffId,
            unitId,
            status: "ACTIVE"
        }
    });
};

const findAll = async (where = {}) => {

    return await StaffUnit.findAll({
        where,
        order: [
            ["createdAt", "DESC"]
        ]
    });
};

const update = async (
    assignment,
    data
) => {

    return await assignment.update(data);
};

const remove = async (assignment) => {

    return await assignment.destroy();
};

module.exports = {
    create,
    findById,
    findByStaffId,
    findByUnitId,
    findActiveByStaffAndUnit,
    findAll,
    update,
    remove
};