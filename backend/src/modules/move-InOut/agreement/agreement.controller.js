const service = require("./agreement.service");


const createAgreement = async (req, res) => {

    try {

        const agreement =
            await service.createAgreement(req.body);

        res.status(201).json({
            success: true,
            message: "Agreement created successfully",
            data: agreement
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const getAgreements = async (req, res) => {

    try {

        const agreements =
            await service.getAgreements();

        res.status(200).json({
            success: true,
            data: agreements
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


const getAgreement = async (req, res) => {

    try {

        const agreement =
            await service.getAgreement(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: agreement
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });

    }
};


const getAgreementByReference = async (
    req,
    res
) => {

    try {

        const agreement =
            await service.getAgreementByReference(
                req.params.reference
            );

        res.status(200).json({
            success: true,
            data: agreement
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });

    }
};


const getAgreementsByUnit = async (
    req,
    res
) => {

    try {

        const agreements =
            await service.getAgreementsByUnit(
                req.params.unitId
            );

        res.status(200).json({
            success: true,
            data: agreements
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


const getAgreementsByTenant = async (
    req,
    res
) => {

    try {

        const agreements =
            await service.getAgreementsByTenant(
                req.params.tenantId
            );

        res.status(200).json({
            success: true,
            data: agreements
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


const getAgreementsByOwner = async (
    req,
    res
) => {

    try {

        const agreements =
            await service.getAgreementsByOwner(
                req.params.ownerId
            );

        res.status(200).json({
            success: true,
            data: agreements
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


const submitAgreement = async (req, res) => {

    try {

        const agreement =
            await service.submitAgreement(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Agreement submitted successfully",
            data: agreement
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const startVerification = async (
    req,
    res
) => {

    try {

        const agreement =
            await service.startVerification(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Agreement moved to verification",
            data: agreement
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const approveAgreement = async (
    req,
    res
) => {

    try {

        const agreement =
            await service.approveAgreement(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Agreement approved successfully",
            data: agreement
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const activateAgreement = async (
    req,
    res
) => {

    try {

        const agreement =
            await service.activateAgreement(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Agreement activated successfully",
            data: agreement
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const rejectAgreement = async (
    req,
    res
) => {

    try {

        const agreement =
            await service.rejectAgreement(
                req.params.id,
                req.body.remarks
            );

        res.status(200).json({
            success: true,
            message: "Agreement rejected",
            data: agreement
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const terminateAgreement = async (
    req,
    res
) => {

    try {

        const agreement =
            await service.terminateAgreement(
                req.params.id,
                req.body.remarks
            );

        res.status(200).json({
            success: true,
            message: "Agreement terminated",
            data: agreement
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

        const agreement =
            await service.markExpiringSoon(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Agreement marked as expiring soon",
            data: agreement
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const markExpired = async (
    req,
    res
) => {

    try {

        const agreement =
            await service.markExpired(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Agreement marked as expired",
            data: agreement
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const updateAgreement = async (
    req,
    res
) => {

    try {

        const agreement =
            await service.updateAgreement(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Agreement updated successfully",
            data: agreement
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const deleteAgreement = async (
    req,
    res
) => {

    try {

        await service.deleteAgreement(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Agreement deleted successfully"
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });

    }
};


module.exports = {
    createAgreement,
    getAgreements,
    getAgreement,
    getAgreementByReference,
    getAgreementsByUnit,
    getAgreementsByTenant,
    getAgreementsByOwner,
    submitAgreement,
    startVerification,
    approveAgreement,
    activateAgreement,
    rejectAgreement,
    terminateAgreement,
    markExpiringSoon,
    markExpired,
    updateAgreement,
    deleteAgreement
};