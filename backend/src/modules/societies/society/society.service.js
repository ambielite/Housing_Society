const societyRepository = require("./society.repository");
const usersRepository = require("../../users/users.repository");

const createSociety = async (data, createdBy) => {

    const existingSocieties =
        await societyRepository.findAllSocieties();

    // your business logic here

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
