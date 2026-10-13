
const Broadcast =
    require("./broadcast.model");


// ============================================================
// CREATE
// ============================================================

const create = async (data) => {

    return await Broadcast.create(data);
};


// ============================================================
// FIND ALL
// ============================================================

const findAll = async (where = {}) => {

    return await Broadcast.findAll({
        where,
        order: [["created_at", "DESC"]]
    });
};


// ============================================================
// FIND BY ID
// ============================================================

const findById = async (id) => {

    return await Broadcast.findByPk(id);
};


// ============================================================
// UPDATE
// ============================================================

const update = async (
    broadcast,
    data
) => {

    return await broadcast.update(data);
};


// ============================================================
// DELETE
// ============================================================

const remove = async (broadcast) => {

    return await broadcast.destroy();
};


module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};

