const securityReportService = require("./securityReport.service");

const getVisitorSummary = async (req, res) => {
    try {

        const result =
            await securityReportService.getVisitorSummary(
                req.query
            );

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        console.error(
            "Visitor summary error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to generate visitor summary",
            error: error.message
        });
    }
};


const getGateSummary = async (req, res) => {
    try {

        const result =
            await securityReportService.getGateSummary(
                req.query
            );

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        console.error(
            "Gate summary error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to generate gate summary",
            error: error.message
        });
    }
};


const getStaffSummary = async (req, res) => {
    try {

        const result =
            await securityReportService.getStaffSummary(
                req.query
            );

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        console.error(
            "Staff summary error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to generate staff summary",
            error: error.message
        });
    }
};


const getPatrolSummary = async (req, res) => {
    try {

        const result =
            await securityReportService.getPatrolSummary(
                req.query
            );

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        console.error(
            "Patrol summary error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to generate patrol summary",
            error: error.message
        });
    }
};


module.exports = {
    getVisitorSummary,
    getGateSummary,
    getStaffSummary,
    getPatrolSummary
};