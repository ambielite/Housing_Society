const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const StaffRepository =
    require("./staff.repository");
const Staff = require("./staff.model");
const sequelize = require("../../../config/database");
const assertUniqueEmail = require("../../../common/assertUniqueEmail");

const {
    validateCreateStaff,
    validateStaffType
} = require("./staff.validation");
const { saveProfilePicture, removeProfilePicture } = require("../../users/profilePicture.storage");

const ensureSecurityHeadAccount = async (staff, transaction) => {
    let userId = null;
    if (staff.email) {
        const [users] = await sequelize.query(
            `SELECT id
             FROM users
             WHERE lower(email) = lower(:email)
               AND (
                 society_id = :societyId
                 OR EXISTS (
                   SELECT 1 FROM user_society_access usa
                   WHERE usa.user_id = users.id
                     AND usa.society_id = :societyId
                     AND usa.active_from <= now()
                     AND (usa.active_until IS NULL OR usa.active_until > now())
                 )
               )
             LIMIT 1`,
            { replacements: { email: staff.email, societyId: staff.societyId }, transaction }
        );
        userId = users[0]?.id || null;
    }

    if (!userId) {
        const [linkedUsers] = await sequelize.query(
            "SELECT user_id FROM security_guards WHERE staff_id = :staffId AND user_id IS NOT NULL LIMIT 1",
            { replacements: { staffId: staff.id }, transaction }
        );
        userId = linkedUsers[0]?.user_id || null;
    }

    if (!userId) {
        // Security staff do not sign in through the app. Create a pending
        // directory account with an unknown random password so the staff
        // member still appears in User Management without usable credentials.
        let accountEmail = staff.email || `security-guard+${staff.id}@no-login.invalid`;
        const [emailOwners] = await sequelize.query(
            "SELECT id FROM users WHERE lower(email) = lower(:email) LIMIT 1",
            { replacements: { email: accountEmail }, transaction }
        );
        if (emailOwners.length) accountEmail = `security-guard+${staff.id}@no-login.invalid`;

        const passwordHash = await bcrypt.hash(crypto.randomBytes(48).toString("base64url"), 12);
        const [createdUsers] = await sequelize.query(
            `INSERT INTO users (society_id, email, phone, password_hash, first_name, last_name, profile_picture_url, status)
             VALUES (:societyId, :email, :phone, :passwordHash, :firstName, :lastName, :profilePictureUrl, 'ACTIVE')
             ON CONFLICT (email) DO NOTHING
             RETURNING id`,
            {
                replacements: {
                    societyId: staff.societyId,
                    email: accountEmail,
                    phone: staff.mobileNumber || null,
                    passwordHash,
                    firstName: staff.firstName,
                    lastName: staff.lastName || null,
                    profilePictureUrl: staff.photoPath || null,
                },
                transaction,
            }
        );
        userId = createdUsers[0]?.id || null;
        if (!userId) {
            const [fallbackUsers] = await sequelize.query(
                `INSERT INTO users (society_id, email, phone, password_hash, first_name, last_name, profile_picture_url, status)
                 VALUES (:societyId, :email, :phone, :passwordHash, :firstName, :lastName, :profilePictureUrl, 'ACTIVE')
                 RETURNING id`,
                {
                    replacements: {
                        societyId: staff.societyId,
                        email: `security-guard+${staff.id}@no-login.invalid`,
                        phone: staff.mobileNumber || null,
                        passwordHash,
                        firstName: staff.firstName,
                        lastName: staff.lastName || null,
                        profilePictureUrl: staff.photoPath || null,
                    },
                    transaction,
                }
            );
            userId = fallbackUsers[0].id;
        }
    }

    const [roles] = await sequelize.query(
        `SELECT id FROM roles WHERE code = 'SECURITY_HEAD' AND society_id IS NULL LIMIT 1`,
        { transaction }
    );
    if (!roles.length) {
        throw new Error("The Security Head system role is missing. Apply the security role seed migration first.");
    }

    await sequelize.query(
        `INSERT INTO user_roles (user_id, role_id, society_id)
         VALUES (:userId, :roleId, :societyId)
         ON CONFLICT (user_id, role_id)
         DO UPDATE SET society_id = EXCLUDED.society_id, assigned_at = now()`,
        { replacements: { userId, roleId: roles[0].id, societyId: staff.societyId }, transaction }
    );
    return userId;
};

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

const syncSecurityGuard = async (staff, transaction) => {
    if (staff.staffType !== "SECURITY_GUARD") {
        await sequelize.query(
            "DELETE FROM security_guards WHERE staff_id = :staffId",
            { replacements: { staffId: staff.id }, transaction }
        );
        return;
    }

    const userId = await ensureSecurityHeadAccount(staff, transaction);
    const guardStatus = staff.status === "ACTIVE"
        ? "ACTIVE"
        : staff.status === "INACTIVE"
            ? "INACTIVE"
            : "SUSPENDED";

    await sequelize.query(
        `INSERT INTO security_guards (staff_id, user_id, employee_code, status)
         VALUES (:staffId, :userId, :employeeCode, :status)
         ON CONFLICT (staff_id) WHERE staff_id IS NOT NULL
         DO UPDATE SET user_id = EXCLUDED.user_id,
                       employee_code = EXCLUDED.employee_code,
                       status = EXCLUDED.status,
                       updated_at = now()`,
        {
            replacements: {
                staffId: staff.id,
                userId,
                employeeCode: staff.employeeCode || null,
                status: guardStatus,
            },
            transaction,
        }
    );
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
        return await sequelize.transaction(async (transaction) => {
            const staff = await StaffRepository.create(
                { ...data, ...(photoPath ? { photoPath } : {}) },
                { transaction }
            );
            await syncSecurityGuard(staff, transaction);
            return staff;
        });
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
        const updated = await sequelize.transaction(async (transaction) => {
            const saved = await StaffRepository.update(staff, {
                ...data,
                ...(photoPath ? { photoPath } : {}),
            }, { transaction });
            await syncSecurityGuard(saved, transaction);
            return saved;
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

    return await sequelize.transaction(async (transaction) => {
        const updated = await StaffRepository.update(staff, { status: "ACTIVE" }, { transaction });
        await syncSecurityGuard(updated, transaction);
        return updated;
    });
};


const deactivateStaff = async (id) => {

    const staff =
        await StaffRepository.findById(id);

    if (!staff) {
        throw new Error("Staff not found");
    }

    return await sequelize.transaction(async (transaction) => {
        const updated = await StaffRepository.update(staff, { status: "INACTIVE" }, { transaction });
        await syncSecurityGuard(updated, transaction);
        return updated;
    });
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
