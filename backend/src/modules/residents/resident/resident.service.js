const residentRepository = require("./resident.repository");
const {
    validateCreateResident,
    validateUpdateResident
} = require("./resident.validation");

const Society = require("../../../modules/societies/society/society.model");
const { saveProfilePicture, removeProfilePicture } = require("../../users/profilePicture.storage");


// ============================================================
// CREATE RESIDENT
// ============================================================

const createResident = async (data, profilePicture) => {

    if (data.email) data.email = data.email.trim().toLowerCase();

    const errors = validateCreateResident(data);

    if (errors.length > 0) {
        throw new Error(errors.join(", "));
    }

    // Verify society
    const society = await Society.findByPk(
        data.societyId
    );

    if (!society) {
        throw new Error("Society not found");
    }

    // Check duplicate mobile inside same society
    const existingMobile =
        await residentRepository.findByMobile(
            data.societyId,
            data.mobile
        );

    if (existingMobile) {
        throw new Error(
            "Resident with this mobile already exists in this society"
        );
    }

    // Check duplicate email inside same society
    if (data.email) {

        const existingEmail =
            await residentRepository.findByEmail(
                data.societyId,
                data.email
            );

        if (existingEmail) {
            throw new Error(
                "Resident with this email already exists in this society"
            );
        }
    }

    // Generate display name
    if (!data.displayName) {

        data.displayName = [
            data.firstName,
            data.middleName,
            data.lastName
        ]
            .filter(Boolean)
            .join(" ");
    }

    const profilePhoto = profilePicture ? saveProfilePicture(profilePicture) : null;
    let resident;
    try {
        resident = await residentRepository.create({ ...data, ...(profilePhoto ? { profilePhoto } : {}) });
    } catch (error) {
        removeProfilePicture(profilePhoto);
        throw error;
    }

    return resident;
};


// ============================================================
// GET ALL RESIDENTS
// ============================================================

const getAllResidents = async (filters = {}) => {

    const where = {};

    if (filters.societyId) {
        where.societyId = filters.societyId;
    }

    if (filters.role) {
        where.role = filters.role;
    }

    if (filters.status) {
        where.status = filters.status;
    }

    if (filters.mobile) {
        where.mobile = filters.mobile;
    }

    if (filters.email) {
        where.email = filters.email;
    }

    return await residentRepository.findAll(where);
};


// ============================================================
// GET RESIDENT BY ID
// ============================================================

const getResidentById = async (
    id,
    societyId
) => {

    const resident =
        societyId
            ? await residentRepository.findByIdAndSociety(
                id,
                societyId
            )
            : await residentRepository.findById(id);

    if (!resident) {
        throw new Error("Resident not found");
    }

    return resident;
};


// ============================================================
// UPDATE RESIDENT
// ============================================================

const updateResident = async (
    id,
    societyId,
    data,
    profilePicture
) => {

    if (data.email) data.email = data.email.trim().toLowerCase();

    const resident =
        await residentRepository.findByIdAndSociety(
            id,
            societyId
        );

    if (!resident) {
        throw new Error("Resident not found");
    }

    const errors =
        validateUpdateResident(data);

    if (errors.length > 0) {
        throw new Error(errors.join(", "));
    }

    // Do not allow society transfer from this module
    if (data.societyId) {
        delete data.societyId;
    }

    // Mobile duplicate check
    if (
        data.mobile &&
        data.mobile !== resident.mobile
    ) {

        const existing =
            await residentRepository.findByMobile(
                societyId,
                data.mobile
            );

        if (
            existing &&
            existing.id !== resident.id
        ) {
            throw new Error(
                "Resident with this mobile already exists in this society"
            );
        }
    }

    // Email duplicate check
    if (
        data.email &&
        data.email !== resident.email
    ) {

        const existing =
            await residentRepository.findByEmail(
                societyId,
                data.email
            );

        if (
            existing &&
            existing.id !== resident.id
        ) {
            throw new Error(
                "Resident with this email already exists in this society"
            );
        }
    }

    // Rebuild display name if name changes
    if (
        data.firstName ||
        data.middleName ||
        data.lastName
    ) {

        data.displayName = [
            data.firstName || resident.firstName,
            data.middleName !== undefined
                ? data.middleName
                : resident.middleName,
            data.lastName || resident.lastName
        ]
            .filter(Boolean)
            .join(" ");
    }

    const previousPhoto = resident.profilePhoto;
    const profilePhoto = profilePicture ? saveProfilePicture(profilePicture) : null;
    try {
        const updated = await residentRepository.update(resident, { ...data, ...(profilePhoto ? { profilePhoto } : {}) });
        if (profilePhoto) removeProfilePicture(previousPhoto);
        return updated;
    } catch (error) {
        removeProfilePicture(profilePhoto);
        throw error;
    }
};


// ============================================================
// CHANGE STATUS
// ============================================================

const changeResidentStatus = async (
    id,
    societyId,
    status
) => {

    const resident =
        await residentRepository.findByIdAndSociety(
            id,
            societyId
        );

    if (!resident) {
        throw new Error("Resident not found");
    }

    const allowedStatuses = [
        "PENDING",
        "ACTIVE",
        "SUSPENDED",
        "BLACKLISTED",
        "ARCHIVED"
    ];

    if (!allowedStatuses.includes(status)) {
        throw new Error(
            `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`
        );
    }

    await residentRepository.update(
        resident,
        { status }
    );

    return resident;
};


// ============================================================
// DELETE RESIDENT
// ============================================================

const deleteResident = async (
    id,
    societyId
) => {

    const resident =
        await residentRepository.findByIdAndSociety(
            id,
            societyId
        );

    if (!resident) {
        throw new Error("Resident not found");
    }

    // Prevent deleting active resident
    if (resident.status === "ACTIVE") {
        throw new Error(
            "Active resident cannot be deleted"
        );
    }

    await residentRepository.deleteResident(
        resident
    );

    return {
        message: "Resident deleted successfully"
    };
};


module.exports = {
    createResident,
    getAllResidents,
    getResidentById,
    updateResident,
    changeResidentStatus,
    deleteResident
};
