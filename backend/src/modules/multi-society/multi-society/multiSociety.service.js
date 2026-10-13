const accessRepository =
    require("./multiSociety.repository");

const Organization =
    require("../organization/organization.model");

const Cluster =
    require("../cluster/cluster.model");

const Society =
    require("../../../modules/societies/society/society.model");


const validateHierarchy = async (
    organizationId,
    clusterId,
    societyId
) => {

    const organization =
        await Organization.findByPk(
            organizationId
        );


    if (!organization) {
        throw new Error(
            "Organization not found"
        );
    }


    if (organization.status !== "ACTIVE") {
        throw new Error(
            "Organization is inactive"
        );
    }


    let cluster = null;
    let society = null;


    if (clusterId) {

        cluster =
            await Cluster.findByPk(
                clusterId
            );


        if (!cluster) {
            throw new Error(
                "Cluster not found"
            );
        }


        if (
            cluster.organizationId !==
            organizationId
        ) {
            throw new Error(
                "Cluster does not belong to organization"
            );
        }


        if (cluster.status !== "ACTIVE") {
            throw new Error(
                "Cluster is inactive"
            );
        }
    }


    if (societyId) {

        society =
            await Society.findByPk(
                societyId
            );


        if (!society) {
            throw new Error(
                "Society not found"
            );
        }


        if (
            society.organizationId !==
            organizationId
        ) {
            throw new Error(
                "Society does not belong to organization"
            );
        }


        if (
            society.clusterId !==
            clusterId
        ) {
            throw new Error(
                "Society does not belong to cluster"
            );
        }
    }


    return {
        organization,
        cluster,
        society
    };
};


const createAccess = async (
    data,
    createdBy
) => {

    await validateHierarchy(
        data.organizationId,
        data.clusterId,
        data.societyId
    );


    const access =
        await accessRepository.create({
            userId: data.userId,

            organizationId:
                data.organizationId || null,

            clusterId:
                data.clusterId || null,

            societyId:
                data.societyId || null,

            accessLevel:
                data.accessLevel,

            role:
                data.role.trim(),

            status:
                data.status || "ACTIVE",

            startDate:
                data.startDate || null,

            endDate:
                data.endDate || null,

            createdBy:
                createdBy || null
        });


    return access;
};


const getUserAccess = async (
    userId
) => {

    return await accessRepository
        .findByUser(userId);
};


const getActiveUserAccess = async (
    userId
) => {

    const accesses =
        await accessRepository
            .findActiveByUser(userId);


    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    return accesses.filter(
        (access) => {

            if (
                access.startDate &&
                today < access.startDate
            ) {
                return false;
            }


            if (
                access.endDate &&
                today > access.endDate
            ) {
                return false;
            }


            return true;
        }
    );
};


const checkSocietyAccess = async (
    userId,
    societyId
) => {

    const society =
        await Society.findByPk(
            societyId
        );


    if (!society) {
        return {
            allowed: false,
            reason: "Society not found"
        };
    }


    const accesses =
        await getActiveUserAccess(
            userId
        );


    for (const access of accesses) {

        if (
            access.accessLevel ===
            "ORGANIZATION"
        ) {

            if (
                access.organizationId ===
                society.organizationId
            ) {
                return {
                    allowed: true,
                    accessLevel:
                        "ORGANIZATION",
                    role: access.role
                };
            }
        }


        if (
            access.accessLevel ===
            "CLUSTER"
        ) {

            if (
                access.clusterId ===
                society.clusterId
            ) {
                return {
                    allowed: true,
                    accessLevel:
                        "CLUSTER",
                    role: access.role
                };
            }
        }


        if (
            access.accessLevel ===
            "SOCIETY"
        ) {

            if (
                access.societyId ===
                societyId
            ) {
                return {
                    allowed: true,
                    accessLevel:
                        "SOCIETY",
                    role: access.role
                };
            }
        }
    }


    return {
        allowed: false,
        reason:
            "User does not have access to this society"
    };
};


const deactivateAccess = async (
    accessId
) => {

    const access =
        await accessRepository.findById(
            accessId
        );


    if (!access) {
        throw new Error(
            "Access record not found"
        );
    }


    return await accessRepository.update(
        access,
        {
            status: "INACTIVE"
        }
    );
};


const activateAccess = async (
    accessId
) => {

    const access =
        await accessRepository.findById(
            accessId
        );


    if (!access) {
        throw new Error(
            "Access record not found"
        );
    }


    await validateHierarchy(
        access.organizationId,
        access.clusterId,
        access.societyId
    );


    return await accessRepository.update(
        access,
        {
            status: "ACTIVE"
        }
    );
};


const deleteAccess = async (
    accessId
) => {

    const access =
        await accessRepository.findById(
            accessId
        );


    if (!access) {
        throw new Error(
            "Access record not found"
        );
    }


    await accessRepository.remove(
        access
    );


    return {
        message:
            "Access record deleted successfully"
    };
};


module.exports = {
    createAccess,
    getUserAccess,
    getActiveUserAccess,
    checkSocietyAccess,
    activateAccess,
    deactivateAccess,
    deleteAccess
};