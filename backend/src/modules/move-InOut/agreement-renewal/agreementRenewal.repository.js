const AgreementRenewal = require("./agreementRenewal.model");

const create = async (data) => {
    return await AgreementRenewal.create(data);
};


const findAll = async () => {
    return await AgreementRenewal.findAll({
        order: [["created_at", "DESC"]]
    });
};


const findById = async (id) => {
    return await AgreementRenewal.findByPk(id);
};


const findByAgreement = async (agreementId) => {
    return await AgreementRenewal.findAll({
        where: {
            agreementId
        },
        order: [["created_at", "DESC"]]
    });
};


const findPending = async () => {
    return await AgreementRenewal.findAll({
        where: {
            status: [
                "SUBMITTED",
                "UNDER_REVIEW",
                "ADDITIONAL_INFO_REQUIRED"
            ]
        },
        order: [["created_at", "ASC"]]
    });
};


const update = async (id, data) => {

    const renewal =
        await AgreementRenewal.findByPk(id);

    if (!renewal) {
        return null;
    }

    await renewal.update(data);

    return renewal;
};


const deleteById = async (id) => {

    const renewal =
        await AgreementRenewal.findByPk(id);

    if (!renewal) {
        return null;
    }

    await renewal.destroy();

    return renewal;
};


module.exports = {
    create,
    findAll,
    findById,
    findByAgreement,
    findPending,
    update,
    deleteById
};