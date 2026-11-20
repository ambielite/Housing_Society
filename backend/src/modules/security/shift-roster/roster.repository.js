const Roster =
    require("./roster.model");


const create = async (data) => {

    return await Roster.create(data);
};


const findById = async (id, options = {}) => {

    return await Roster.findByPk(id, options);
};


const findByStaffId = async (
    staffId
) => {

    return await Roster.findAll({
        where: {
            staffId
        },
        order: [
            ["rosterDate", "DESC"]
        ]
    });
};


const findByDate = async (
    rosterDate
) => {

    return await Roster.findAll({
        where: {
            rosterDate
        },
        order: [
            ["createdAt", "ASC"]
        ]
    });
};


const findAll = async (
    where = {}
) => {

    return await Roster.findAll({
        where,
        order: [
            ["rosterDate", "DESC"]
        ]
    });
};


const update = async (
    roster,
    data,
    options = {}
) => {

    return await roster.update(
        data,
        options
    );
};


const remove = async (
    roster
) => {

    return await roster.destroy();
};


module.exports = {
    create,
    findById,
    findByStaffId,
    findByDate,
    findAll,
    update,
    remove
};
