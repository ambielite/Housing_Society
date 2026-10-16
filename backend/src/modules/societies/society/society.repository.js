const Society = require("./society.model");
const sequelize = require("../../../config/database");
const { Op } = require("sequelize");

const findAllSocieties = async () => {
    return await Society.findAll({
        order: [["created_at", "DESC"]]
    });
};

const findSocietiesByIds = async (ids) => {
    if (!ids.length) return [];
    return Society.findAll({ where: { id: { [Op.in]: ids } }, order: [["created_at", "DESC"]] });
};

const findSocietyById = async (id) => {
    return await Society.findByPk(id);
};

const createSociety = async (data, createdBy) => {
    return sequelize.transaction(async (transaction) => {
        const society = await Society.create(data, { transaction });
        if (createdBy) {
            await sequelize.query(
                `INSERT INTO user_society_access (user_id, society_id, access_level)
                 VALUES (:userId, :societyId, 'ADMIN')
                 ON CONFLICT (user_id, society_id)
                 DO UPDATE SET active_from = now(), active_until = NULL`,
                { replacements: { userId: createdBy, societyId: society.id }, transaction }
            );
        }
        return society;
    });
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
    findSocietiesByIds,
    findSocietyById,
    createSociety,
    updateSociety,
    deleteSociety
};
