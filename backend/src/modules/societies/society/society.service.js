const societyRepository = require("./society.repository");
const usersRepository = require("../../users/users.repository");
const assertUniqueEmail = require("../../../common/assertUniqueEmail");
const Society = require("./society.model");

const createSociety = async (data, createdBy) => {
    if (data.email) data.email = data.email.trim().toLowerCase();
    await assertUniqueEmail({ model: Society, email: data.email, message: "A society with this email already exists." });

    return await societyRepository.createSociety(data, createdBy);
};

const getAllSocieties = async (user) => {
    if (user?.roles?.includes("SUPER_ADMIN")) return societyRepository.findAllSocieties();
    const accessible = await usersRepository.listAccessibleSocieties(user.id, false);
    return societyRepository.findSocietiesByIds(accessible.map((society) => society.id));
};

const getSocietyById = async (id) => {
    return await societyRepository.findSocietyById(id);
};

const updateSociety = async (id, data) => {
    if (data.email) data.email = data.email.trim().toLowerCase();
    if (data.email !== undefined) await assertUniqueEmail({ model: Society, email: data.email, excludeId: id, message: "A society with this email already exists." });
    return await societyRepository.updateSociety(id, data);
};

const deleteSociety = async (id) => {
    return await societyRepository.deleteSociety(id);
};

module.exports = {
    createSociety,
    getAllSocieties,
    getSocietyById,
    updateSociety,
    deleteSociety
};
