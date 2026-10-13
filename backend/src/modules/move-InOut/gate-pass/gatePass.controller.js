const service = require("./gatePass.service");


const createGatePass = async (req, res) => {
    try {

        const gatePass =
            await service.createGatePass(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Gate pass created successfully",
            data: gatePass
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getGatePasses = async (req, res) => {
    try {

        const gatePasses =
            await service.getGatePasses();

        res.status(200).json({
            success: true,
            data: gatePasses
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getGatePass = async (req, res) => {
    try {

        const gatePass =
            await service.getGatePass(
                req.params.id
            );

        if (!gatePass) {
            return res.status(404).json({
                success: false,
                message:
                    "Gate pass not found"
            });
        }

        res.status(200).json({
            success: true,
            data: gatePass
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getActiveGatePasses = async (
    req,
    res
) => {
    try {

        const gatePasses =
            await service.getActiveGatePasses();

        res.status(200).json({
            success: true,
            data: gatePasses
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getGatePassByCode = async (
    req,
    res
) => {
    try {

        const gatePass =
            await service.getGatePassByCode(
                req.params.passCode
            );

        if (!gatePass) {
            return res.status(404).json({
                success: false,
                message:
                    "Gate pass not found"
            });
        }

        res.status(200).json({
            success: true,
            data: gatePass
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getGatePassesByLifecycle = async (
    req,
    res
) => {
    try {

        const gatePasses =
            await service.getGatePassesByLifecycle(
                req.params.lifecycleType,
                req.params.lifecycleId
            );

        res.status(200).json({
            success: true,
            data: gatePasses
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const verifyGatePass = async (
    req,
    res
) => {
    try {

        const gatePass =
            await service.verifyGatePass(
                req.params.id,
                req.body.verifiedBy
            );

        res.status(200).json({
            success: true,
            message:
                "Gate pass verified successfully",
            data: gatePass
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const useGatePass = async (
    req,
    res
) => {
    try {

        const gatePass =
            await service.useGatePass(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Gate pass used successfully",
            data: gatePass
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const cancelGatePass = async (
    req,
    res
) => {
    try {

        const gatePass =
            await service.cancelGatePass(
                req.params.id,
                req.body.remarks
            );

        res.status(200).json({
            success: true,
            message:
                "Gate pass cancelled successfully",
            data: gatePass
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteGatePass = async (
    req,
    res
) => {
    try {

        const gatePass =
            await service.deleteGatePass(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Gate pass deleted successfully",
            data: gatePass
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    createGatePass,
    getGatePasses,
    getGatePass,
    getActiveGatePasses,
    getGatePassByCode,
    getGatePassesByLifecycle,
    verifyGatePass,
    useGatePass,
    cancelGatePass,
    deleteGatePass
};