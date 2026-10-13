const Agreement = require("./agreement.model");

const create = async (data) => {
    return await Agreement.create(data);
};

const findAll = async () => {
    return await Agreement.findAll({
        order: [["created_at", "DESC"]]
    });
};

const findById = async (id) => {
    return await Agreement.findByPk(id);
};

const findByReference = async (agreementReference) => {
    return await Agreement.findOne({
        where: {
            agreementReference
        }
    });
};

const findByUnit = async (unitId) => {
    return await Agreement.findAll({
        where: {
            unitId
        },
        order: [["startDate", "DESC"]]
    });
};

const findByTenant = async (tenantId) => {
    return await Agreement.findAll({
        where: {
            tenantId
        },
        order: [["startDate", "DESC"]]
    });
};

const findByOwner = async (ownerId) => {
    return await Agreement.findAll({
        where: {
            ownerId
        },
        order: [["startDate", "DESC"]]
    });
};

const findActiveByUnit = async (unitId) => {
    return await Agreement.findOne({
        where: {
            unitId,
            status: [
                "ACTIVE",
                "EXPIRING_SOON",
                "RENEWAL_INITIATED"
            ]
        }
    });
};

const findExpiringAgreements = async () => {
    return await Agreement.findAll({
        where: {
            status: "ACTIVE"
        },
        order: [["expiryDate", "ASC"]]
    });
};

const update = async (id, data) => {
    const agreement = await Agreement.findByPk(id);

    if (!agreement) {
        return null;
    }

    await agreement.update(data);

    return agreement;
};

const deleteById = async (id) => {
    const agreement = await Agreement.findByPk(id);

    if (!agreement) {
        return null;
    }

    await agreement.destroy();

    return agreement;
};

module.exports = {
    create,
    findAll,
    findById,
    findByReference,
    findByUnit,
    findByTenant,
    findByOwner,
    findActiveByUnit,
    findExpiringAgreements,
    update,
    deleteById
};