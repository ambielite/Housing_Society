const clusterRepository =
    require("./cluster.repository");

const Organization =
    require("../organization/organization.model");


const createCluster = async (data) => {

    const organization =
        await Organization.findByPk(
            data.organizationId
        );


    if (!organization) {
        throw new Error(
            "Organization not found"
        );
    }


    if (organization.status !== "ACTIVE") {
        throw new Error(
            "Cannot create cluster under an inactive organization"
        );
    }


    const code =
        data.code.trim().toUpperCase();


    const existingCluster =
        await clusterRepository.findByOrganizationAndCode(
            data.organizationId,
            code
        );


    if (existingCluster) {
        throw new Error(
            "Cluster code already exists in this organization"
        );
    }


    return await clusterRepository.create({
        organizationId:
            data.organizationId,

        name:
            data.name.trim(),

        code,

        description:
            data.description || null,

        status:
            data.status || "ACTIVE"
    });
};


const getClusters = async () => {

    return await clusterRepository.findAll();
};


const getClustersByOrganization = async (
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


    return await clusterRepository
        .findAllByOrganization(
            organizationId
        );
};


const getClusterById = async (id) => {

    const cluster =
        await clusterRepository.findById(id);


    if (!cluster) {
        throw new Error(
            "Cluster not found"
        );
    }


    return cluster;
};


const updateCluster = async (
    id,
    data
) => {

    const cluster =
        await clusterRepository.findById(id);


    if (!cluster) {
        throw new Error(
            "Cluster not found"
        );
    }


    const updateData = {};


    if (data.name !== undefined) {
        updateData.name =
            data.name.trim();
    }


    if (data.code !== undefined) {

        const code =
            data.code
                .trim()
                .toUpperCase();


        const existingCluster =
            await clusterRepository
                .findByOrganizationAndCode(
                    cluster.organizationId,
                    code
                );


        if (
            existingCluster &&
            existingCluster.id !== id
        ) {
            throw new Error(
                "Cluster code already exists in this organization"
            );
        }


        updateData.code = code;
    }


    if (data.description !== undefined) {
        updateData.description =
            data.description;
    }


    if (data.status !== undefined) {
        updateData.status =
            data.status;
    }


    return await clusterRepository.update(
        cluster,
        updateData
    );
};


const activateCluster = async (id) => {

    const cluster =
        await clusterRepository.findById(id);


    if (!cluster) {
        throw new Error(
            "Cluster not found"
        );
    }


    const organization =
        await Organization.findByPk(
            cluster.organizationId
        );


    if (!organization) {
        throw new Error(
            "Organization not found"
        );
    }


    if (organization.status !== "ACTIVE") {
        throw new Error(
            "Cannot activate cluster under an inactive organization"
        );
    }


    return await clusterRepository.update(
        cluster,
        {
            status: "ACTIVE"
        }
    );
};


const deactivateCluster = async (id) => {

    const cluster =
        await clusterRepository.findById(id);


    if (!cluster) {
        throw new Error(
            "Cluster not found"
        );
    }


    return await clusterRepository.update(
        cluster,
        {
            status: "INACTIVE"
        }
    );
};


const deleteCluster = async (id) => {

    const cluster =
        await clusterRepository.findById(id);


    if (!cluster) {
        throw new Error(
            "Cluster not found"
        );
    }


    await clusterRepository.remove(
        cluster
    );


    return {
        message:
            "Cluster deleted successfully"
    };
};


module.exports = {
    createCluster,
    getClusters,
    getClustersByOrganization,
    getClusterById,
    updateCluster,
    activateCluster,
    deactivateCluster,
    deleteCluster
};