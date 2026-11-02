const residentRepository = require("./resident.repository");
const {
    validateCreateResident,
    validateUpdateResident
} = require("./resident.validation");

const Society = require("../../../modules/societies/society/society.model");
const sequelize = require("../../../config/database");
const bcrypt = require("bcryptjs");
const { QueryTypes } = require("sequelize");
const { saveProfilePicture, removeProfilePicture } = require("../../users/profilePicture.storage");


// ============================================================
// CREATE RESIDENT
// ============================================================

const createResident = async (data, profilePicture, assignedBy) => {

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

    let residentAccount = null;
    if (data.userId) {
        const residentAccounts = await residentRepository.listResidentRoleUsers({
            societyId: data.societyId,
            userId: data.userId
        });
        residentAccount = residentAccounts[0];
        if (!residentAccount) {
            throw new Error("The selected user must have only the active Resident role in this society and must not already be linked to a resident record");
        }
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
        resident = await sequelize.transaction(async (transaction) => {
            let userId = data.userId;
            let residentRoleId = residentAccount?.resident_role_id;

            if (!userId) {
                const existingAccount = await sequelize.query(
                    "SELECT id FROM users WHERE lower(email) = lower(:email) LIMIT 1",
                    { replacements: { email: data.email }, type: QueryTypes.SELECT, transaction }
                );
                if (existingAccount.length) {
                    throw new Error("An account already uses this email. Select it from the existing Resident account list or use another email.");
                }

                const residentRoles = await sequelize.query(
                    "SELECT id FROM roles WHERE code = 'RESIDENT_APP' AND society_id IS NULL AND status = 'ACTIVE' LIMIT 1",
                    { type: QueryTypes.SELECT, transaction }
                );
                residentRoleId = residentRoles[0]?.id;
                if (!residentRoleId) {
                    throw new Error("The Resident role is not configured. Run the backend migrations and try again.");
                }

                const passwordHash = await bcrypt.hash(data.accountPassword, 12);
                const createdUsers = await sequelize.query(
                    `INSERT INTO users (society_id, email, phone, password_hash, first_name, last_name, status)
                     VALUES (:societyId, :email, :phone, :passwordHash, :firstName, :lastName, 'ACTIVE')
                     RETURNING id`,
                    {
                        replacements: {
                            societyId: data.societyId,
                            email: data.email,
                            phone: data.mobile || null,
                            passwordHash,
                            firstName: data.firstName,
                            lastName: data.lastName
                        },
                        type: QueryTypes.SELECT,
                        transaction
                    }
                );
                userId = createdUsers[0].id;
            }

            const { accountPassword, ...residentData } = data;
            const created = await residentRepository.create(
                { ...residentData, userId, ...(profilePhoto ? { profilePhoto } : {}) },
                { transaction }
            );

            // Ensure the Resident app role is attached to this account and
            // scoped to the resident's society, in the same DB transaction.
            await sequelize.query(
                `INSERT INTO user_roles (user_id, role_id, society_id, assigned_by)
                 VALUES (:userId, :roleId, :societyId, :assignedBy)
                 ON CONFLICT (user_id, role_id)
                 DO UPDATE SET society_id = EXCLUDED.society_id,
                               assigned_at = now(),
                               assigned_by = EXCLUDED.assigned_by`,
                {
                    replacements: {
                        userId,
                        roleId: residentRoleId,
                        societyId: data.societyId,
                        assignedBy: assignedBy || null
                    },
                    transaction
                }
            );
            return created;
        });
    } catch (error) {
        removeProfilePicture(profilePhoto);
        throw error;
    }

    return resident;
};

const listResidentRoleUsers = async (societyId) => {
    return residentRepository.listResidentRoleUsers({ societyId });
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
    listResidentRoleUsers,
    getAllResidents,
    getResidentById,
    updateResident,
    changeResidentStatus,
    deleteResident
};
