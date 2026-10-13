const StaffAttendance =
    require("./staffAttendance.model");


const create = async (data) => {

    return await StaffAttendance.create(
        data
    );
};


const findById = async (id) => {

    return await StaffAttendance.findByPk(
        id
    );
};


const findByStaffAndDate = async (
    staffId,
    attendanceDate
) => {

    return await StaffAttendance.findOne({
        where: {
            staffId,
            attendanceDate
        }
    });
};


const findByStaffId = async (
    staffId
) => {

    return await StaffAttendance.findAll({
        where: {
            staffId
        },
        order: [
            ["attendanceDate", "DESC"]
        ]
    });
};


const findAll = async (
    where = {}
) => {

    return await StaffAttendance.findAll({
        where,
        order: [
            ["attendanceDate", "DESC"]
        ]
    });
};


const update = async (
    attendance,
    data
) => {

    return await attendance.update(
        data
    );
};


const remove = async (
    attendance
) => {

    return await attendance.destroy();
};


module.exports = {
    create,
    findById,
    findByStaffAndDate,
    findByStaffId,
    findAll,
    update,
    remove
};