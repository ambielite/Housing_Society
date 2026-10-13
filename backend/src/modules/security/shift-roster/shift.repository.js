const Shift =
    require("./shift.model");


const create = async (data) => {

    return await Shift.create(data);
};


const findById = async (id) => {

    return await Shift.findByPk(id);
};


const findByCode = async (
    societyId,
    shiftCode
) => {

    return await Shift.findOne({
        where: {
            societyId,
            shiftCode
        }
    });
};


const findAll = async (
    where = {}
) => {

    return await Shift.findAll({
        where,
        order: [
            ["shiftName", "ASC"]
        ]
    });
};


const update = async (
    shift,
    data
) => {

    return await shift.update(data);
};


const remove = async (
    shift
) => {

    return await shift.destroy();
};


module.exports = {
    create,
    findById,
    findByCode,
    findAll,
    update,
    remove
};