const service = require("./classified.service");


const createClassified = async (req, res) => {

    try {

        const classified =
            await service.createClassified(req.body);

        res.status(201).json({
            success: true,
            message: "Classified listing created successfully",
            data: classified
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getClassifieds = async (req, res) => {

    try {

        const classifieds =
            await service.getClassifieds(req.query);

        res.status(200).json({
            success: true,
            count: classifieds.length,
            data: classifieds
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getClassifiedById = async (req, res) => {

    try {

        const classified =
            await service.getClassifiedById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: classified
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const updateClassified = async (req, res) => {

    try {

        const classified =
            await service.updateClassified(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Classified listing updated successfully",
            data: classified
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const submitForApproval = async (req, res) => {

    try {

        const classified =
            await service.submitForApproval(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Classified submitted for approval",
            data: classified
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const approveClassified = async (req, res) => {

    try {

        const classified =
            await service.approveClassified(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Classified listing approved",
            data: classified
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const rejectClassified = async (req, res) => {

    try {

        const classified =
            await service.rejectClassified(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Classified listing rejected",
            data: classified
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const publishClassified = async (req, res) => {

    try {

        const classified =
            await service.publishClassified(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Classified listing published",
            data: classified
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const markAsSold = async (req, res) => {

    try {

        const classified =
            await service.markAsSold(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Classified listing marked as sold",
            data: classified
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const removeClassified = async (req, res) => {

    try {

        const classified =
            await service.removeClassified(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Classified listing removed",
            data: classified
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const expireClassified = async (req, res) => {

    try {

        const classified =
            await service.expireClassified(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Classified listing expired",
            data: classified
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteClassified = async (req, res) => {

    try {

        await service.deleteClassified(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Classified listing deleted successfully"
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    createClassified,
    getClassifieds,
    getClassifiedById,
    updateClassified,
    submitForApproval,
    approveClassified,
    rejectClassified,
    publishClassified,
    markAsSold,
    removeClassified,
    expireClassified,
    deleteClassified
};