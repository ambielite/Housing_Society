const Society = require("../../../modules/societies/society/society.model");
const Vendor = require("../vendor/vendor.model");
const Asset = require("../asset/asset.model");

const AMC = require("./amc.model");

const amcRepository =
    require("./amc.repository");

const {
    validateCreateAMC
} = require("./amc.validation");


const createAMC = async (data) => {

    const errors =
        validateCreateAMC(data);

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


    const vendor =
        await Vendor.findByPk(
            data.vendorId
        );

    if (!vendor) {
        throw new Error(
            "Vendor not found"
        );
    }


    if (
        vendor.societyId !==
        data.societyId
    ) {

        throw new Error(
            "Vendor does not belong to this society"
        );
    }


    if (vendor.status !== "ACTIVE") {
        throw new Error(
            "AMC can only be created for an active vendor"
        );
    }


    const asset =
        await Asset.findByPk(
            data.assetId
        );

    if (!asset) {
        throw new Error(
            "Asset not found"
        );
    }


    if (
        asset.societyId !==
        data.societyId
    ) {

        throw new Error(
            "Asset does not belong to this society"
        );
    }


    const existingAMC =
        await amcRepository.findByAmcNumber(
            data.societyId,
            data.amcNumber
        );

    if (existingAMC) {
        throw new Error(
            "AMC number already exists in this society"
        );
    }


    const startDate =
        new Date(data.startDate);

    const endDate =
        new Date(data.endDate);


    if (endDate < startDate) {
        throw new Error(
            "endDate cannot be before startDate"
        );
    }


    return await amcRepository.create(
        data
    );
};


const getAllAMCs = async (
    filters = {}
) => {

    const where = {};

    if (filters.societyId) {
        where.societyId =
            filters.societyId;
    }

    if (filters.vendorId) {
        where.vendorId =
            filters.vendorId;
    }

    if (filters.assetId) {
        where.assetId =
            filters.assetId;
    }

    if (filters.status) {
        where.status =
            filters.status;
    }

    return await amcRepository.findAll(
        where
    );
};


const getAMCById = async (id) => {

    const amc =
        await amcRepository.findById(id);

    if (!amc) {
        throw new Error(
            "AMC not found"
        );
    }

    return amc;
};


const getAMCsByAssetId = async (
    assetId
) => {

    const asset =
        await Asset.findByPk(
            assetId
        );

    if (!asset) {
        throw new Error(
            "Asset not found"
        );
    }

    return await amcRepository.findByAssetId(
        assetId
    );
};


const activateAMC = async (id) => {

    const amc =
        await amcRepository.findById(id);

    if (!amc) {
        throw new Error(
            "AMC not found"
        );
    }


    if (
        amc.status === "TERMINATED"
    ) {

        throw new Error(
            "Terminated AMC cannot be activated"
        );
    }


    if (
        amc.status === "EXPIRED"
    ) {

        throw new Error(
            "Expired AMC cannot be activated. Create a renewal AMC."
        );
    }


    return await amcRepository.update(
        amc,
        {
            status: "ACTIVE"
        }
    );
};


const markExpiringSoon = async (
    id
) => {

    const amc =
        await amcRepository.findById(id);

    if (!amc) {
        throw new Error(
            "AMC not found"
        );
    }


    if (amc.status !== "ACTIVE") {
        throw new Error(
            "Only active AMC can be marked as expiring soon"
        );
    }


    return await amcRepository.update(
        amc,
        {
            status: "EXPIRING_SOON"
        }
    );
};


const initiateRenewal = async (
    id
) => {

    const amc =
        await amcRepository.findById(id);

    if (!amc) {
        throw new Error(
            "AMC not found"
        );
    }


    if (
        ![
            "ACTIVE",
            "EXPIRING_SOON"
        ].includes(amc.status)
    ) {

        throw new Error(
            "Renewal can only be initiated for active or expiring AMC"
        );
    }


    if (!amc.renewalRequired) {
        throw new Error(
            "Renewal is not required for this AMC"
        );
    }


    return await amcRepository.update(
        amc,
        {
            status: "RENEWAL_INITIATED"
        }
    );
};


const renewAMC = async (
    id,
    data
) => {

    const oldAMC =
        await amcRepository.findById(id);

    if (!oldAMC) {
        throw new Error(
            "AMC not found"
        );
    }


    if (
        ![
            "ACTIVE",
            "EXPIRING_SOON",
            "RENEWAL_INITIATED"
        ].includes(oldAMC.status)
    ) {

        throw new Error(
            "This AMC cannot be renewed"
        );
    }


    if (!data.startDate) {
        throw new Error(
            "New startDate is required"
        );
    }


    if (!data.endDate) {
        throw new Error(
            "New endDate is required"
        );
    }


    const newStartDate =
        new Date(data.startDate);

    const newEndDate =
        new Date(data.endDate);


    if (newEndDate < newStartDate) {
        throw new Error(
            "New endDate cannot be before new startDate"
        );
    }


    const newAmcNumber =
        data.amcNumber ||
        `${oldAMC.amcNumber}-R1`;


    const existing =
        await amcRepository.findByAmcNumber(
            oldAMC.societyId,
            newAmcNumber
        );

    if (existing) {
        throw new Error(
            "Renewal AMC number already exists"
        );
    }


    const renewalData = {

        societyId:
            oldAMC.societyId,

        amcNumber:
            newAmcNumber,

        vendorId:
            data.vendorId ||
            oldAMC.vendorId,

        assetId:
            data.assetId ||
            oldAMC.assetId,

        startDate:
            data.startDate,

        endDate:
            data.endDate,

        contractCost:
            data.contractCost !== undefined
                ? data.contractCost
                : oldAMC.contractCost,

        sla:
            data.sla !== undefined
                ? data.sla
                : oldAMC.sla,

        responseTime:
            data.responseTime !== undefined
                ? data.responseTime
                : oldAMC.responseTime,

        resolutionTime:
            data.resolutionTime !== undefined
                ? data.resolutionTime
                : oldAMC.resolutionTime,

        renewalRequired:
            data.renewalRequired !== undefined
                ? data.renewalRequired
                : oldAMC.renewalRequired,

        parentAmcId:
            oldAMC.id,

        status:
            "ACTIVE",

        remarks:
            data.remarks ||
            `Renewal of AMC ${oldAMC.amcNumber}`
    };


    const newAMC =
        await createAMC(
            renewalData
        );


    await amcRepository.update(
        oldAMC,
        {
            status: "RENEWED",
            renewalDate:
                data.startDate
        }
    );


    return newAMC;
};


const expireAMC = async (id) => {

    const amc =
        await amcRepository.findById(id);

    if (!amc) {
        throw new Error(
            "AMC not found"
        );
    }


    if (
        [
            "RENEWED",
            "TERMINATED"
        ].includes(amc.status)
    ) {

        throw new Error(
            "AMC cannot be marked expired from current status"
        );
    }


    return await amcRepository.update(
        amc,
        {
            status: "EXPIRED"
        }
    );
};


const terminateAMC = async (id) => {

    const amc =
        await amcRepository.findById(id);

    if (!amc) {
        throw new Error(
            "AMC not found"
        );
    }


    if (amc.status === "TERMINATED") {
        throw new Error(
            "AMC is already terminated"
        );
    }


    return await amcRepository.update(
        amc,
        {
            status: "TERMINATED"
        }
    );
};


const deleteAMC = async (id) => {

    const amc =
        await amcRepository.findById(id);

    if (!amc) {
        throw new Error(
            "AMC not found"
        );
    }


    if (
        [
            "ACTIVE",
            "EXPIRING_SOON",
            "RENEWAL_INITIATED",
            "RENEWED"
        ].includes(amc.status)
    ) {

        throw new Error(
            "Active AMC records cannot be deleted"
        );
    }


    return await amcRepository.deleteAMC(
        amc
    );
};


const updateExpiredAMCs = async () => {

    const amcs =
        await AMC.findAll({
            where: {
                status: [
                    "ACTIVE",
                    "EXPIRING_SOON",
                    "RENEWAL_INITIATED"
                ]
            }
        });


    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    let expiredCount = 0;


    for (const amc of amcs) {

        const endDate =
            new Date(amc.endDate);

        endDate.setHours(
            0,
            0,
            0,
            0
        );


        if (endDate < today) {

            await amcRepository.update(
                amc,
                {
                    status: "EXPIRED"
                }
            );

            expiredCount++;
        }
    }


    return {
        expiredCount
    };
};


module.exports = {
    createAMC,
    getAllAMCs,
    getAMCById,
    getAMCsByAssetId,
    activateAMC,
    markExpiringSoon,
    initiateRenewal,
    renewAMC,
    expireAMC,
    terminateAMC,
    deleteAMC,
    updateExpiredAMCs
};