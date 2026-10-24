const StaffRepository =
    require("./staff.repository");
const Staff = require("./staff.model");
const assertUniqueEmail = require("../../../common/assertUniqueEmail");

const {
    validateCreateStaff,
    validateStaffType
} = require("./staff.validation");
const { saveProfilePicture, removeProfilePicture } = require("../../users/profilePicture.storage");

const normalizeDateOnly = (value, field, fallback = null, required = false) => {
    if (value === undefined || value === null || String(value).trim() === "") {
        if (required && fallback) return fallback;
        if (required) throw new Error(`${field} must be a valid date (YYYY-MM-DD)`);
        return null;
    }

    const date = String(value).trim().match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
    if (date) {
        const parsed = new Date(`${date}T00:00:00.000Z`);
        if (!Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date) {
            return date;
        }
    }

    if (fallback) return fallback;
    if (required) throw new Error(`${field} must be a valid date (YYYY-MM-DD)`);
    return null;
};


const createStaff = async (data, profilePicture) => {

    const validationError =
        validateCreateStaff(data);

    if (validationError) {
        throw new Error(validationError);
    }

    if (data.email) data.email = data.email.trim().toLowerCase();
    data.joiningDate = normalizeDateOnly(data.joiningDate, "Joining date", null, true);
    if (data.dateOfBirth !== undefined) data.dateOfBirth = normalizeDateOnly(data.dateOfBirth, "Date of birth");

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

    await assertUniqueEmail({ model: Staff, email: data.email, where: { societyId: data.societyId }, message: "A staff member with this email already exists in this society." });

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

    if (data.joiningDate !== undefined) {
        data.joiningDate = normalizeDateOnly(data.joiningDate, "Joining date", staff.joiningDate, true);
    }
    if (data.dateOfBirth !== undefined) {
        data.dateOfBirth = normalizeDateOnly(data.dateOfBirth, "Date of birth", staff.dateOfBirth);
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

    if (data.email !== undefined) {
        if (data.email) data.email = data.email.trim().toLowerCase();
        await assertUniqueEmail({ model: Staff, email: data.email, where: { societyId: staff.societyId }, excludeId: id, message: "A staff member with this email already exists in this society." });
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
