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
const residentDashboardEvents = require("../../resident-dashboard/residentDashboardEvents");
const Unit = require("../../societies/unit/unit.model");
const OwnerUnit = require("../owner-unit/ownerUnit.model");
const Occupancy = require("../../move-InOut/occupancy/occupancy.model");


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

    if (data.role === "FAMILY_MEMBER") {
        const familyOwner = await residentRepository.findEligibleFamilyOwner(data.familyOwnerId, data.societyId);
        if (!familyOwner) throw new Error("Select an active primary owner or co-owner in this society as the family member's owner");
    } else {
        data.familyOwnerId = null;
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
            const requiresUnit = ["PRIMARY_OWNER", "CO_OWNER", "TENANT"].includes(data.role);
            let assignedUnit = null;
            if (requiresUnit) {
                assignedUnit = await Unit.findByPk(data.unitId, {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });
                if (!assignedUnit || assignedUnit.status !== "VACANT") {
                    throw new Error("Selected unit is already assigned or unavailable. Choose a vacant unit.");
                }
                const activeOwnership = await OwnerUnit.findOne({
                    where: { unitId: data.unitId, status: "ACTIVE" },
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });
                const currentOccupancy = await Occupancy.findOne({
                    where: { unitId: data.unitId, isCurrent: true },
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });
                if (activeOwnership || currentOccupancy) {
                    throw new Error("Selected unit is already assigned. Choose a vacant unit.");
                }
            }

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

            if (requiresUnit) {
                const effectiveFrom = new Date().toISOString().slice(0, 10);
                if (data.role === "TENANT") {
                    await Occupancy.create({
                        societyId: data.societyId,
                        unitId: data.unitId,
                        residentId: created.id,
                        occupancyType: "TENANT",
                        startDate: effectiveFrom,
                        billingStartDate: effectiveFrom,
                        isCurrent: true
                    }, { transaction });
                } else {
                    await OwnerUnit.create({
                        societyId: data.societyId,
                        ownerId: created.id,
                        unitId: data.unitId,
                        ownershipType: data.role,
                        effectiveFrom,
                        status: "ACTIVE"
                    }, { transaction });
                }
                await assignedUnit.update({ status: "OCCUPIED" }, { transaction });
            }

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
            if (profilePhoto) {
                await sequelize.query(
                    "UPDATE users SET profile_picture_url = :profilePhoto, updated_at = now() WHERE id = :userId",
                    { replacements: { profilePhoto, userId }, transaction }
                );
            }
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

    const nextRole = data.role || resident.role;
    const nextFamilyOwnerId = data.familyOwnerId !== undefined ? data.familyOwnerId : resident.familyOwnerId;
    if (nextRole === "FAMILY_MEMBER") {
        const familyOwner = await residentRepository.findEligibleFamilyOwner(nextFamilyOwnerId, societyId, resident.id);
        if (!familyOwner) throw new Error("Select an active primary owner or co-owner in this society as the family member's owner");
        data.familyOwnerId = nextFamilyOwnerId;
    } else {
        data.familyOwnerId = null;
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

    // A linked resident's email is also their login identifier. Keep the
    // account and resident record aligned, and prevent changing it to another
    // account's email address.
    if (resident.userId && data.email && data.email !== resident.email) {
        const existingAccount = await sequelize.query(
            "SELECT id FROM users WHERE lower(email) = lower(:email) AND id <> :userId LIMIT 1",
            { replacements: { email: data.email.trim(), userId: resident.userId }, type: QueryTypes.SELECT }
        );
        if (existingAccount.length) {
            throw new Error("An account already uses this email. Enter a different email address.");
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
    const changedResidentFields = [
        ["firstName", "first name"],
        ["middleName", "middle name"],
        ["lastName", "last name"],
        ["email", "email address"],
        ["mobile", "phone number"],
        ["alternateMobile", "alternate phone number"],
        ["dateOfBirth", "date of birth"],
        ["emergencyContactName", "emergency contact name"],
        ["emergencyContactMobile", "emergency contact phone"],
        ["emergencyContactRelation", "emergency contact relationship"],
        ["role", "resident type"],
        ["familyOwnerId", "family owner"],
        ["status", "account status"],
        ["directoryPhoneVisible", "directory visibility"],
        ["personalFields", "additional profile details"],
        ["remarks", "resident notes"],
    ].filter(([field]) => {
        if (!Object.prototype.hasOwnProperty.call(data, field)) return false;
        const before = resident[field];
        const after = data[field];
        if (before == null && after == null) return false;
        if (typeof before === "object" || typeof after === "object") {
            return JSON.stringify(before ?? null) !== JSON.stringify(after ?? null);
        }
        return String(before ?? "") !== String(after ?? "");
    }).map(([, label]) => label);
    if (profilePhoto) changedResidentFields.push("profile picture");
    let notificationUserIdForEvent = resident.userId;
    try {
        const updated = await sequelize.transaction(async (transaction) => {
            const savedResident = await residentRepository.update(
                resident,
                { ...data, ...(profilePhoto ? { profilePhoto } : {}) },
                { transaction }
            );
            if (resident.userId) {
                await sequelize.query(
                    `UPDATE users SET
                       email = COALESCE(:email, email),
                       phone = COALESCE(:mobile, phone),
                       first_name = COALESCE(:firstName, first_name),
                       last_name = COALESCE(:lastName, last_name),
                       updated_at = now()
                     WHERE id = :userId`,
                    {
                        replacements: {
                            email: data.email === undefined ? null : data.email.trim().toLowerCase(),
                            mobile: data.mobile === undefined ? null : data.mobile,
                            firstName: data.firstName === undefined ? null : data.firstName,
                            lastName: data.lastName === undefined ? null : data.lastName,
                            userId: resident.userId
                        },
                        transaction
                    }
                );
            }
            if (profilePhoto && resident.userId) {
                await sequelize.query(
                    "UPDATE users SET profile_picture_url = :profilePhoto, updated_at = now() WHERE id = :userId",
                    { replacements: { profilePhoto, userId: resident.userId }, transaction }
                );
            }
            if (changedResidentFields.length > 0) {
                if (!notificationUserIdForEvent && resident.email) {
                    const matchingUsers = await sequelize.query(
                        `SELECT u.id FROM users u
                         JOIN user_roles ur ON ur.user_id = u.id
                         JOIN roles r ON r.id = ur.role_id AND r.code = 'RESIDENT_APP' AND r.status = 'ACTIVE'
                         WHERE u.society_id = :societyId AND lower(u.email) = lower(:email)
                           AND u.status = 'ACTIVE'
                           AND (ur.society_id = :societyId OR ur.society_id IS NULL)
                         LIMIT 1`,
                        {
                            replacements: { societyId, email: resident.email },
                            type: QueryTypes.SELECT,
                            transaction
                        }
                    );
                    notificationUserIdForEvent = matchingUsers[0]?.id || null;
                }
                if (notificationUserIdForEvent) {
                    const changedDetails = changedResidentFields.join(", ");
                    await sequelize.query(
                        `INSERT INTO notifications
                           (society_id, user_id, channel, notification_type, title, subject, message,
                            data, reference_type, reference_id, priority, status, is_read, created_at, updated_at)
                         VALUES
                           (:societyId, :userId, 'IN_APP', 'OPERATIONAL', :title, :title, :message,
                            CAST(:data AS jsonb), 'RESIDENT_PROFILE', :residentId, 'MEDIUM', 'PENDING', false, now(), now())`,
                        {
                            replacements: {
                                societyId,
                                userId: notificationUserIdForEvent,
                                title: "Your resident profile was updated",
                                message: `The society admin updated your ${changedDetails}.`,
                                data: JSON.stringify({ changedFields: changedResidentFields }),
                                residentId: resident.id
                            },
                            transaction
                        }
                    );
                }
            }
            return savedResident;
        });
        if (profilePhoto) removeProfilePicture(previousPhoto);
        if (changedResidentFields.length > 0) {
            residentDashboardEvents.publishToUser(
                notificationUserIdForEvent,
                "resident-updated"
            );
        }
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

    const statusChanged = resident.status !== status;
    await sequelize.transaction(async (transaction) => {
        await residentRepository.update(resident, { status }, { transaction });
        if (statusChanged && resident.userId) {
            await sequelize.query(
                `INSERT INTO notifications
                   (society_id, user_id, channel, notification_type, title, subject, message,
                    data, reference_type, reference_id, priority, status, is_read, created_at, updated_at)
                 VALUES
                   (:societyId, :userId, 'IN_APP', 'OPERATIONAL', :title, :title, :message,
                    CAST(:data AS jsonb), 'RESIDENT_PROFILE', :residentId, 'MEDIUM', 'PENDING', false, now(), now())`,
                {
                    replacements: {
                        societyId,
                        userId: resident.userId,
                        title: "Your resident profile was updated",
                        message: `The society admin updated your account status to ${status.toLowerCase()}.`,
                        data: JSON.stringify({ changedFields: ["account status"] }),
                        residentId: resident.id
                    },
                    transaction
                }
            );
        }
    });
    if (statusChanged) {
        residentDashboardEvents.publishToUser(resident.userId, "resident-updated");
    }

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
