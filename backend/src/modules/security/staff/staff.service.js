const StaffRepository =
    require("./staff.repository");

const {
    validateCreateStaff,
    validateStaffType
} = require("./staff.validation");
const { saveProfilePicture, removeProfilePicture } = require("../../users/profilePicture.storage");


const createStaff = async (data, profilePicture) => {

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

    const photoPath = profilePicture ? saveProfilePicture(profilePicture) : null;
    try {
        return await StaffRepository.create({ ...data, ...(photoPath ? { photoPath } : {}) });
    } catch (error) {
        if (photoPath) removeProfilePicture(photoPath);
        throw error;
    }
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


const updateStaff = async (id, data, profilePicture) => {

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

    const previousPhotoPath = staff.photoPath;
    const photoPath = profilePicture ? saveProfilePicture(profilePicture) : null;
    try {
        const updated = await StaffRepository.update(staff, {
            ...data,
            ...(photoPath ? { photoPath } : {}),
        });
        if (photoPath && previousPhotoPath) removeProfilePicture(previousPhotoPath);
        return updated;
    } catch (error) {
        if (photoPath) removeProfilePicture(photoPath);
        throw error;
    }
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
    if (staff.photoPath) removeProfilePicture(staff.photoPath);

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
