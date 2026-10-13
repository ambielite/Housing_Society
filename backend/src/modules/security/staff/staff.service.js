const StaffRepository =
    require("./staff.repository");

const {
    validateCreateStaff,
    validateStaffType
} = require("./staff.validation");


const createStaff = async (data) => {

    const validationError =
        validateCreateStaff(data);

    if (validationError) {
        throw new Error(validationError);
    }

    const staffTypeError =
        validateStaffType(data.staffType);

    if (staffTypeError) {
        throw new Error(staffTypeError);
    }

    const existingStaff =
        await StaffRepository.findByEmployeeCode(
            data.societyId,
            data.employeeCode
        );

    if (existingStaff) {
        throw new Error(
            "Employee code already exists in this society"
        );
    }

    return await StaffRepository.create(data);
};


const getStaffById = async (id) => {

    const staff =
        await StaffRepository.findById(id);

    if (!staff) {
        throw new Error("Staff not found");
    }

    return staff;
};


const getAllStaff = async (filters = {}) => {

    return await StaffRepository.findAll(filters);
};


const updateStaff = async (id, data) => {

    const staff =
        await StaffRepository.findById(id);

    if (!staff) {
        throw new Error("Staff not found");
    }

    if (data.employeeCode) {

        const existingStaff =
            await StaffRepository.findByEmployeeCode(
                staff.societyId,
                data.employeeCode
            );

        if (
            existingStaff &&
            existingStaff.id !== staff.id
        ) {
            throw new Error(
                "Employee code already exists"
            );
        }
    }

    if (data.staffType) {

        const error =
            validateStaffType(data.staffType);

        if (error) {
            throw new Error(error);
        }
    }

    return await StaffRepository.update(
        staff,
        data
    );
};


const activateStaff = async (id) => {

    const staff =
        await StaffRepository.findById(id);

    if (!staff) {
        throw new Error("Staff not found");
    }

    return await StaffRepository.update(
        staff,
        {
            status: "ACTIVE"
        }
    );
};


const deactivateStaff = async (id) => {

    const staff =
        await StaffRepository.findById(id);

    if (!staff) {
        throw new Error("Staff not found");
    }

    return await StaffRepository.update(
        staff,
        {
            status: "INACTIVE"
        }
    );
};


const deleteStaff = async (id) => {

    const staff =
        await StaffRepository.findById(id);

    if (!staff) {
        throw new Error("Staff not found");
    }

    await StaffRepository.remove(staff);

    return {
        message: "Staff deleted successfully"
    };
};


module.exports = {
    createStaff,
    getStaffById,
    getAllStaff,
    updateStaff,
    activateStaff,
    deactivateStaff,
    deleteStaff
};