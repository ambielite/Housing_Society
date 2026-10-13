
const WorkOrder =
    require("./workOrder.model");


const create = async (data) => {
    return await WorkOrder.create(data);
};


const findAll = async (
    where = {}
) => {

    return await WorkOrder.findAll({
        where,
        order: [
            ["scheduledDate", "ASC"],
            ["created_at", "DESC"]
        ]
    });
};


const findById = async (id) => {
    return await WorkOrder.findByPk(id);
};


const findByWorkOrderNumber = async (
    societyId,
    workOrderNumber
) => {

    return await WorkOrder.findOne({
        where: {
            societyId,
            workOrderNumber
        }
    });
};


const findByAssetId = async (
    assetId
) => {

    return await WorkOrder.findAll({
        where: {
            assetId
        },
        order: [
            ["scheduledDate", "DESC"]
        ]
    });
};


const update = async (
    workOrder,
    data
) => {

    return await workOrder.update(
        data
    );
};


const deleteWorkOrder = async (
    workOrder
) => {

    return await workOrder.destroy();
};


module.exports = {
    create,
    findAll,
    findById,
    findByWorkOrderNumber,
    findByAssetId,
    update,
    deleteWorkOrder
};

