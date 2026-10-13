const amcService =
    require("./amc.service");


const createAMC = async (
    req,
    res
) => {

    try {

        const amc =
            await amcService.createAMC(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "AMC created successfully",
            data: amc
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const getAllAMCs = async (
    req,
    res
) => {

    try {

        const amcs =
            await amcService.getAllAMCs(
                req.query
            );

        res.status(200).json({
            success: true,
            count: amcs.length,
            data: amcs
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const getAMCById = async (
    req,
    res
) => {

    try {

        const amc =
            await amcService.getAMCById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: amc
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });

    }
};


const getAMCsByAssetId = async (
    req,
    res
) => {

    try {

        const amcs =
            await amcService.getAMCsByAssetId(
                req.params.assetId
            );

        res.status(200).json({
            success: true,
            count: amcs.length,
            data: amcs
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });

    }
};


const activateAMC = async (
    req,
    res
) => {

    try {

        const amc =
            await amcService.activateAMC(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "AMC activated successfully",
            data: amc
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const markExpiringSoon = async (
    req,
    res
) => {

    try {

        const amc =
            await amcService.markExpiringSoon(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "AMC marked as expiring soon",
            data: amc
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const initiateRenewal = async (
    req,
    res
) => {

    try {

        const amc =
            await amcService.initiateRenewal(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "AMC renewal initiated successfully",
            data: amc
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const renewAMC = async (
    req,
    res
) => {

    try {

        const amc =
            await amcService.renewAMC(
                req.params.id,
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "AMC renewed successfully",
            data: amc
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const expireAMC = async (
    req,
    res
) => {

    try {

        const amc =
            await amcService.expireAMC(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "AMC marked as expired",
            data: amc
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const terminateAMC = async (
    req,
    res
) => {

    try {

        const amc =
            await amcService.terminateAMC(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "AMC terminated successfully",
            data: amc
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const updateExpiredAMCs = async (
    req,
    res
) => {

    try {

        const result =
            await amcService.updateExpiredAMCs();

        res.status(200).json({
            success: true,
            message:
                "Expired AMC records updated successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const deleteAMC = async (
    req,
    res
) => {

    try {

        await amcService.deleteAMC(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message:
                "AMC deleted successfully"
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
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
    updateExpiredAMCs,
    deleteAMC
};