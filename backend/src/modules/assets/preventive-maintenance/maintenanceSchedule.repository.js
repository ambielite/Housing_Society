
const MaintenanceSchedule =
    require("./maintenanceSchedule.model");


const create = async (data) => {
    return await MaintenanceSchedule.create(data);
};


const findAll = async (where = {}) => {

    return await MaintenanceSchedule.findAll({
        where,
        order: [
            ["nextDueDate", "ASC"],
            ["created_at", "DESC"]
        ]
    });
};


const findById = async (id) => {
    return await MaintenanceSchedule.findByPk(id);
};


const findByScheduleCode = async (
    societyId,
    scheduleCode
) => {

    return await MaintenanceSchedule.findOne({
        where: {
            societyId,
            scheduleCode
        }
    });
};


const findByAssetId = async (assetId) => {

    return await MaintenanceSchedule.findAll({
        where: {
            assetId
        },
        order: [
            ["nextDueDate", "ASC"]
        ]
    });
};


const update = async (
    schedule,
    data
) => {

    return await schedule.update(data);
};


const deleteSchedule = async (
    schedule
) => {

    return await schedule.destroy();
};


module.exports = {
    create,
    findAll,
    findById,
    findByScheduleCode,
    findByAssetId,
    update,
    deleteSchedule
};

