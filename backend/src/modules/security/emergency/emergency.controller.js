const emergencyService =
    require("./emergency.service");


const createEmergency = async (
    req,
    res
) => {

    try {

        const emergency =
            await emergencyService.createEmergency(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Emergency created successfully",
            data: emergency
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getAllEmergencies = async (
    req,
    res
) => {

    try {

        const emergencies =
            await emergencyService.getAllEmergencies(
                req.query
            );

        res.status(200).json({
            success: true,
            count: emergencies.length,
            data: emergencies
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getEmergencyById = async (
    req,
    res
) => {

    try {

        const emergency =
            await emergencyService.getEmergencyById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: emergency
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const updateEmergency = async (
    req,
    res
) => {

    try {

        const emergency =
            await emergencyService.updateEmergency(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message:
                "Emergency updated successfully",
            data: emergency
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const acknowledgeEmergency = async (
    req,
    res
) => {

    try {

        const emergency =
            await emergencyService.acknowledgeEmergency(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Emergency acknowledged",
            data: emergency
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const startResponse = async (
    req,
    res
) => {

    try {

        const emergency =
            await emergencyService.startResponse(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message:
                "Emergency response started",
            data: emergency
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const resolveEmergency = async (
    req,
    res
) => {

    try {

        const emergency =
            await emergencyService.resolveEmergency(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message:
                "Emergency resolved successfully",
            data: emergency
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const closeEmergency = async (
    req,
    res
) => {

    try {

        const emergency =
            await emergencyService.closeEmergency(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Emergency closed successfully",
            data: emergency
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const cancelEmergency = async (
    req,
    res
) => {

    try {

        const emergency =
            await emergencyService.cancelEmergency(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message:
                "Emergency cancelled",
            data: emergency
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const markFalseAlarm = async (
    req,
    res
) => {

    try {

        const emergency =
            await emergencyService.markFalseAlarm(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message:
                "Emergency marked as false alarm",
            data: emergency
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const assignEmergency = async (
    req,
    res
) => {

    try {

        const emergency =
            await emergencyService.assignEmergency(
                req.params.id,
                req.body.staffId
            );

        res.status(200).json({
            success: true,
            message:
                "Emergency assigned successfully",
            data: emergency
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const updateEmergencyContacts = async (
    req,
    res
) => {

    try {

        const emergency =
            await emergencyService.updateEmergencyContacts(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message:
                "Emergency contacts updated",
            data: emergency
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteEmergency = async (
    req,
    res
) => {

    try {

        await emergencyService.deleteEmergency(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message:
                "Emergency deleted successfully"
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    createEmergency,
    getAllEmergencies,
    getEmergencyById,
    updateEmergency,
    acknowledgeEmergency,
    startResponse,
    resolveEmergency,
    closeEmergency,
    cancelEmergency,
    markFalseAlarm,
    assignEmergency,
    updateEmergencyContacts,
    deleteEmergency
};