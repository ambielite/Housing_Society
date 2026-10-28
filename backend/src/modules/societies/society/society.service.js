const societyRepository = require("./society.repository");
const usersRepository = require("../../users/users.repository");
const assertUniqueEmail = require("../../../common/assertUniqueEmail");
const Society = require("./society.model");
const { saveSocietyLogo, removeSocietyLogo } = require("./societyLogo.storage");

const createSociety = async (data, createdBy, logoFile) => {
    if (data.email) data.email = data.email.trim().toLowerCase();
    await assertUniqueEmail({ model: Society, email: data.email, message: "A society with this email already exists." });
    const logoUrl = logoFile ? saveSocietyLogo(logoFile) : null;
    try {
        return await societyRepository.createSociety({ ...data, logoUrl }, createdBy);
    } catch (error) {
        removeSocietyLogo(logoUrl);
        throw error;
    }
};

const getAllSocieties = async (user) => {
    if (user?.roles?.includes("SUPER_ADMIN")) return societyRepository.findAllSocieties();
    const accessible = await usersRepository.listAccessibleSocieties(user.id, false);
    return societyRepository.findSocietiesByIds(accessible.map((society) => society.id));
};

const getSocietyById = async (id) => {
    return await societyRepository.findSocietyById(id);
};

const updateSociety = async (id, data, logoFile) => {
    if (data.email) data.email = data.email.trim().toLowerCase();
    if (data.email !== undefined) await assertUniqueEmail({ model: Society, email: data.email, excludeId: id, message: "A society with this email already exists." });
    const current = await societyRepository.findSocietyById(id);
    if (!current) return null;
    const logoUrl = logoFile ? saveSocietyLogo(logoFile) : undefined;
    const shouldRemoveLogo = data.removeLogo === true;
    const fields = { ...data };
    delete fields.removeLogo;
    try {
        const updated = await societyRepository.updateSociety(id, {
            ...fields,
            ...(logoUrl ? { logoUrl } : shouldRemoveLogo ? { logoUrl: null } : {}),
        });
        if (logoUrl || shouldRemoveLogo) removeSocietyLogo(current.logoUrl);
        return updated;
    } catch (error) {
        removeSocietyLogo(logoUrl);
        throw error;
    }
};

const deleteSociety = async (id) => {
    const society = await societyRepository.findSocietyById(id);
    const deleted = await societyRepository.deleteSociety(id);
    if (deleted) removeSocietyLogo(society?.logoUrl);
    return deleted;
};

module.exports = {
    createSociety,
    getAllSocieties,
    getSocietyById,
    updateSociety,
    deleteSociety
};
