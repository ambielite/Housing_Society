const Society =
    require("../../../modules/societies/society/society.model");

const Organization =
    require("../organization/organization.model");

const Cluster =
    require("../cluster/cluster.model");

const { Op } = require("sequelize");


const validateHierarchy = async (
    organizationId,
    clusterId
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


    const cluster =
        await Cluster.findByPk(
            clusterId
        );


    if (!cluster) {
        throw new Error(
            "Cluster not found"
        );
    }


    if (cluster.status !== "ACTIVE") {
        throw new Error(
            "Cluster is inactive"
        );
    }


    if (
        String(cluster.organizationId).toLowerCase() !==
        String(organizationId).toLowerCase()
    ) {
        throw new Error(
            "Cluster does not belong to the selected organization"
        );
    }


    return {
        organization,
        cluster
    };
};


const assignSociety = async (
    societyId,
    organizationId,
    clusterId
) => {

    const society =
        await Society.findByPk(
            societyId
        );


    if (!society) {
        throw new Error(
            "Society not found"
        );
    }


    await validateHierarchy(
        organizationId,
        clusterId
    );


    return await society.update({
        organizationId,
        clusterId
    });
};


const getSocietiesByOrganization = async (
    organizationId
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


    return await Society.findAll({
        where: {
            organizationId
        },

        order: [
            ["created_at", "DESC"]
        ]
    });
};


const getSocietiesByCluster = async (
    clusterId
) => {

    const cluster =
        await Cluster.findByPk(
            clusterId
        );


    if (!cluster) {
        throw new Error(
            "Cluster not found"
        );
    }


    return await Society.findAll({
        where: {
            clusterId
        },

        order: [
            ["created_at", "DESC"]
        ]
    });
};


const getSocietyHierarchy = async (
    societyId
) => {

    const society =
        await Society.findByPk(
            societyId
        );


    if (!society) {
        throw new Error(
            "Society not found"
        );
    }


    let organization = null;
    let cluster = null;


    if (society.organizationId) {

        organization =
            await Organization.findByPk(
                society.organizationId
            );
    }


    if (society.clusterId) {

        cluster =
            await Cluster.findByPk(
                society.clusterId
            );
    }


    return {
        organization,
        cluster,
        society
    };
};


const getOrganizationHierarchy = async (
    organizationId
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


    const clusters =
        await Cluster.findAll({
            where: {
                organizationId
            },

            order: [
                ["created_at", "ASC"]
            ]
        });


    const societies =
        await Society.findAll({
            where: {
                organizationId
            },

            order: [
                ["created_at", "ASC"]
            ]
        });


    return {
        organization,
        clusters,
        societies
    };
};


const getClusterHierarchy = async (
    clusterId
) => {

    const cluster =
        await Cluster.findByPk(
            clusterId
        );


    if (!cluster) {
        throw new Error(
            "Cluster not found"
        );
    }


    const organization =
        await Organization.findByPk(
            cluster.organizationId
        );


    const societies =
        await Society.findAll({
            where: {
                clusterId
            },

            order: [
                ["created_at", "ASC"]
            ]
        });


    return {
        organization,
        cluster,
        societies
    };
};


const removeSocietyMapping = async (
    societyId
) => {

    const society =
        await Society.findByPk(
            societyId
        );


    if (!society) {
        throw new Error(
            "Society not found"
        );
    }


    society.organizationId = null;
    society.clusterId = null;


    await society.save();


    return society;
};


module.exports = {
    assignSociety,
    getSocietiesByOrganization,
    getSocietiesByCluster,
    getSocietyHierarchy,
    getOrganizationHierarchy,
    getClusterHierarchy,
    removeSocietyMapping
};
