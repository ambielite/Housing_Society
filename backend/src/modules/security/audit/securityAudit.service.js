const auditRepository =
    require("./securityAudit.repository");

const Society =
    require("../../societies/society/society.model");

const Staff =
    require("../staff/staff.model");


const createAudit = async (data) => {

    const errors = [];


    if (!data.societyId) {
        errors.push(
            "societyId is required"
        );
    }


    if (!data.action) {
        errors.push(
            "action is required"
        );
    }


    if (!data.module) {
        errors.push(
            "module is required"
        );
    }


    if (errors.length > 0) {

        throw new Error(
            errors.join(", ")
        );
    }


    const society =
        await Society.findByPk(
            data.societyId
        );


    if (!society) {

        throw new Error(
            "Society not found"
        );
    }


    if (data.userId) {

        const staff =
            await Staff.findByPk(
                data.userId
            );


        if (
            staff &&
            staff.societyId !==
                data.societyId
        ) {

            throw new Error(
                "User does not belong to this society"
            );
        }
    }


    return await auditRepository.create(
        data
    );
};


const getAllAudits = async (
    filters = {}
) => {

    const where = {};


    if (filters.societyId) {

        where.societyId =
            filters.societyId;
    }


    if (filters.userId) {

        where.userId =
            filters.userId;
    }


    if (filters.action) {

        where.action =
            filters.action;
    }


    if (filters.module) {

        where.module =
            filters.module;
    }


    if (filters.entityId) {

        where.entityId =
            filters.entityId;
    }


    if (filters.severity) {

        where.severity =
            filters.severity;
    }


    let limit = 50;

    let offset = 0;


    if (filters.limit) {

        limit =
            parseInt(filters.limit);

        if (
            isNaN(limit) ||
            limit <= 0
        ) {
            limit = 50;
        }
    }


    if (filters.offset) {

        offset =
            parseInt(filters.offset);

        if (
            isNaN(offset) ||
            offset < 0
        ) {
            offset = 0;
        }
    }


    const audits =
        await auditRepository.findAll(
            where,
            {
                limit,
                offset
            }
        );


    const total =
        await auditRepository.count(
            where
        );


    return {
        total,
        limit,
        offset,
        audits
    };
};


const getAuditById = async (id) => {

    const audit =
        await auditRepository.findById(
            id
        );


    if (!audit) {

        throw new Error(
            "Audit record not found"
        );
    }


    return audit;
};


const createSystemAudit = async ({
    societyId,
    action,
    module,
    entityId = null,
    entityType = null,
    description = null,
    oldValues = null,
    newValues = null,
    severity = "INFO",
    userId = null,
    userType = "SYSTEM",
    userName = null,
    ipAddress = null,
    userAgent = null,
    deviceInfo = null,
    requestId = null
}) => {

    return await auditRepository.create({

        societyId,

        userId,

        userType,

        userName,

        action,

        module,

        entityId,

        entityType,

        description,

        oldValues,

        newValues,

        severity,

        ipAddress,

        userAgent,

        deviceInfo,

        requestId
    });
};


const deleteAudit = async (id) => {

    const audit =
        await getAuditById(id);


    return await auditRepository.deleteAudit(
        audit
    );
};


module.exports = {
    createAudit,
    getAllAudits,
    getAuditById,
    createSystemAudit,
    deleteAudit
};