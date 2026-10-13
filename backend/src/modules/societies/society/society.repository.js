const Society = require("./society.model");

const findAllSocieties = async () => {
    return await Society.findAll({
        order: [["created_at", "DESC"]]
    });
};

const findSocietyById = async (id) => {
    return await Society.findByPk(id);
};

const createSociety = async (data) => {
    return await Society.create(data);
};

const updateSociety = async (id, data) => {
    const society = await Society.findByPk(id);

    if (!society) {
        return null;
    }

    await society.update(data);

    return society;
};

const deleteSociety = async (id) => {
    const society = await Society.findByPk(id);

    if (!society) {
        return null;
    }

    await society.destroy();

    return society;
};

module.exports = {
    findAllSocieties,
    findSocietyById,
    createSociety,
    updateSociety,
    deleteSociety
};