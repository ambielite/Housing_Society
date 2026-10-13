const BillingResponsibility =
    require("./billingResponsibility.model");


const create = async (data) => {
    return await BillingResponsibility.create(data);
};


const findAll = async () => {
    return await BillingResponsibility.findAll({
        order: [["startDate", "DESC"]]
    });
};


const findById = async (id) => {
    return await BillingResponsibility.findByPk(id);
};


const findCurrentByUnit = async (unitId) => {
    return await BillingResponsibility.findOne({
        where: {
            unitId,
            isCurrent: true
        }
    });
};


const findByUnit = async (unitId) => {
    return await BillingResponsibility.findAll({
        where: {
            unitId
        },
        order: [["startDate", "DESC"]]
    });
};


const findByResident = async (residentId) => {
    return await BillingResponsibility.findAll({
        where: {
            residentId
        },
        order: [["startDate", "DESC"]]
    });
};


const findCurrentByResident = async (
    residentId
) => {
    return await BillingResponsibility.findAll({
        where: {
            residentId,
            isCurrent: true
        },
        order: [["startDate", "DESC"]]
    });
};


const update = async (id, data) => {

    const responsibility =
        await BillingResponsibility.findByPk(id);

    if (!responsibility) {
        return null;
    }

    await responsibility.update(data);

    return responsibility;
};


const closeResponsibility = async (
    id,
    endDate
) => {

    const responsibility =
        await BillingResponsibility.findByPk(id);

    if (!responsibility) {
        return null;
    }

    await responsibility.update({
        endDate,
        isCurrent: false
    });

    return responsibility;
};


const deleteById = async (id) => {

    const responsibility =
        await BillingResponsibility.findByPk(id);

    if (!responsibility) {
        return null;
    }

    await responsibility.destroy();

    return responsibility;
};


module.exports = {
    create,
    findAll,
    findById,
    findCurrentByUnit,
    findByUnit,
    findByResident,
    findCurrentByResident,
    update,
    closeResponsibility,
    deleteById
};