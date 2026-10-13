const incidentService =
    require("./incident.service");


const createIncident = async (req, res) => {

    try {

        const incident =
            await incidentService.createIncident(
                req.body
            );

        res.status(201).json({
            success: true,
            message: "Incident created successfully",
            data: incident
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getAllIncidents = async (req, res) => {

    try {

        const incidents =
            await incidentService.getAllIncidents(
                req.query
            );

        res.status(200).json({
            success: true,
            count: incidents.length,
            data: incidents
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getIncidentById = async (req, res) => {

    try {

        const incident =
            await incidentService.getIncidentById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: incident
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const updateIncident = async (req, res) => {

    try {

        const incident =
            await incidentService.updateIncident(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Incident updated successfully",
            data: incident
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const acknowledgeIncident = async (
    req,
    res
) => {

    try {

        const incident =
            await incidentService.acknowledgeIncident(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Incident acknowledged",
            data: incident
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const startInvestigation = async (
    req,
    res
) => {

    try {

        const incident =
            await incidentService.startInvestigation(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Investigation started",
            data: incident
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const resolveIncident = async (
    req,
    res
) => {

    try {

        const incident =
            await incidentService.resolveIncident(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Incident resolved successfully",
            data: incident
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const closeIncident = async (
    req,
    res
) => {

    try {

        const incident =
            await incidentService.closeIncident(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Incident closed successfully",
            data: incident
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const rejectIncident = async (
    req,
    res
) => {

    try {

        const incident =
            await incidentService.rejectIncident(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Incident rejected",
            data: incident
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const assignIncident = async (
    req,
    res
) => {

    try {

        const incident =
            await incidentService.assignIncident(
                req.params.id,
                req.body.staffId
            );

        res.status(200).json({
            success: true,
            message: "Incident assigned successfully",
            data: incident
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteIncident = async (
    req,
    res
) => {

    try {

        await incidentService.deleteIncident(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Incident deleted successfully"
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    createIncident,
    getAllIncidents,
    getIncidentById,
    updateIncident,
    acknowledgeIncident,
    startInvestigation,
    resolveIncident,
    closeIncident,
    rejectIncident,
    assignIncident,
    deleteIncident
};