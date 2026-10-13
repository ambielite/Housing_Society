const societyRepository = require("./society.repository");

const createSociety = async (data) => {

    const existingSocieties =
        await societyRepository.findAllSocieties();

    // your business logic here

    return await societyRepository.createSociety(data);
};

const getAllSocieties = async () => {
    return await societyRepository.findAllSocieties();
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