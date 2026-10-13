const service =
    require("./agreementRenewal.service");


const createRenewal = async (req, res) => {

    try {

        const renewal =
            await service.createRenewal(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Renewal application created successfully",
            data: renewal
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getRenewals = async (req, res) => {

    try {

        const renewals =
            await service.getRenewals();

        res.status(200).json({
            success: true,
            data: renewals
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getRenewal = async (req, res) => {

    try {

        const renewal =
            await service.getRenewal(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: renewal
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const getRenewalsByAgreement = async (
    req,
    res
) => {

    try {

        const renewals =
            await service.getRenewalsByAgreement(
                req.params.agreementId
            );

        res.status(200).json({
            success: true,
            data: renewals
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getPendingRenewals = async (
    req,
    res
) => {

    try {

        const renewals =
            await service.getPendingRenewals();

        res.status(200).json({
            success: true,
            data: renewals
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const submitRenewal = async (req, res) => {

    try {

        const renewal =
            await service.submitRenewal(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Renewal submitted successfully",
            data: renewal
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const startReview = async (req, res) => {

    try {

        const renewal =
            await service.startReview(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Renewal moved to review",
            data: renewal
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const requestAdditionalInformation =
    async (req, res) => {

        try {

            const renewal =
                await service.requestAdditionalInformation(
                    req.params.id,
                    req.body.remarks
                );

            res.status(200).json({
                success: true,
                message:
                    "Additional information requested",
                data: renewal
            });

        } catch (error) {

            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    };


const approveRenewal = async (req, res) => {

    try {

        const renewal =
            await service.approveRenewal(
                req.params.id,
                req.body.approvedBy,
                req.body.remarks
            );

        res.status(200).json({
            success: true,
            message:
                "Renewal approved successfully",
            data: renewal
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const rejectRenewal = async (req, res) => {

    try {

        const renewal =
            await service.rejectRenewal(
                req.params.id,
                req.body.remarks
            );

        res.status(200).json({
            success: true,
            message:
                "Renewal rejected",
            data: renewal
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const completeRenewal = async (req, res) => {

    try {

        const renewal =
            await service.completeRenewal(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Renewal completed successfully",
            data: renewal
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const updateRenewal = async (req, res) => {

    try {

        const renewal =
            await service.updateRenewal(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message:
                "Renewal updated successfully",
            data: renewal
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteRenewal = async (req, res) => {

    try {

        await service.deleteRenewal(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message:
                "Renewal deleted successfully"
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {

    createRenewal,

    getRenewals,

    getRenewal,

    getRenewalsByAgreement,

    getPendingRenewals,

    submitRenewal,

    startReview,

    requestAdditionalInformation,

    approveRenewal,

    rejectRenewal,

    completeRenewal,

    updateRenewal,

    deleteRenewal
};