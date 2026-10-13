const repository = require("./societyAccess.repository");

const {
    validateCreateAccess,
    validateUpdateAccess,
    validateId
} = require("./societyAccess.validation");


// CREATE ACCESS
const createAccess = async (data) => {

    const errors = validateCreateAccess(data);

    if (errors.length > 0) {
        throw new Error(errors.join(", "));
    }

    const existing =
        await repository.findUserAccess(
            data.userId,
            data.societyId
        );

    if (existing) {
        throw new Error(
            "User already has access to this society"
        );
    }

    return await repository.create(data);
};


// GET USER SOCIETIES
const getUserSocieties = async (userId) => {

    if (!validateId(userId)) {
        throw new Error("Invalid userId");
    }

    return await repository.findUserSocieties(userId);
};


// GET DEFAULT SOCIETY
const getDefaultSociety = async (userId) => {

    if (!validateId(userId)) {
        throw new Error("Invalid userId");
    }

    const access =
        await repository.findDefaultSociety(userId);

    if (!access) {
        throw new Error(
            "Default society not configured"
        );
    }

    return access;
};


// SWITCH SOCIETY
const switchSociety = async (
    userId,
    societyId
) => {

    if (!validateId(userId)) {
        throw new Error("Invalid userId");
    }

    if (!validateId(societyId)) {
        throw new Error("Invalid societyId");
    }

    const access =
        await repository.findUserAccess(
            userId,
            societyId
        );

    if (!access) {
        throw new Error(
            "User does not have access to this society"
        );
    }

    if (!access.isActive) {
        throw new Error(
            "Society access is inactive"
        );
    }

    if (
        access.validUntil &&
        new Date(access.validUntil) < new Date()
    ) {
        throw new Error(
            "Society access has expired"
        );
    }

    return {
        societyId: access.societyId,
        organizationId: access.organizationId,
        clusterId: access.clusterId,
        accessType: access.accessType,
        permissions: access.permissions
    };
};


// UPDATE ACCESS
const updateAccess = async (id, data) => {

    const access =
        await repository.findById(id);

    if (!access) {
        throw new Error(
            "Society access not found"
        );
    }

    const errors =
        validateUpdateAccess(data);

    if (errors.length > 0) {
        throw new Error(errors.join(", "));
    }

    return await repository.update(
        access,
        data
    );
};


// REMOVE ACCESS
const removeAccess = async (id) => {

    const access =
        await repository.findById(id);

    if (!access) {
        throw new Error(
            "Society access not found"
        );
    }

    await repository.remove(access);

    return {
        message:
            "Society access removed successfully"
    };
};


// CHECK ACCESS
const checkAccess = async (
    userId,
    societyId
) => {

    const access =
        await repository.findUserAccess(
            userId,
            societyId
        );

    if (!access) {
        return false;
    }

    if (!access.isActive) {
        return false;
    }

    if (
        access.validUntil &&
        new Date(access.validUntil) < new Date()
    ) {
        return false;
    }

    return true;
};


module.exports = {
    createAccess,
    getUserSocieties,
    getDefaultSociety,
    switchSociety,
    updateAccess,
    removeAccess,
    checkAccess
};