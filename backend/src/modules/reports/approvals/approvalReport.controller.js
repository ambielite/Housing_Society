const service = require("./approvalReport.service");

const {
    validateSocietyId,
    validateDateRange
} = require("./approvalReport.validation");


/*
|--------------------------------------------------------------------------
| Combined Dashboard
|--------------------------------------------------------------------------
*/

const getApprovalsDashboard = async (req, res) => {

    try {

        const {
            societyId,
            fromDate,
            toDate
        } = req.query;


        validateSocietyId(societyId);

        validateDateRange(
            fromDate,
            toDate
        );


        const data =
            await service.getApprovalsDashboard({
                societyId,
                fromDate,
                toDate
            });


        res.status(200).json({
            success: true,
            message:
                "Approval, SLA and payment report fetched successfully",
            data
        });

    } catch (error) {

        console.error(
            "Approval dashboard report error:",
            error
        );

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


/*
|--------------------------------------------------------------------------
| Approval Report
|--------------------------------------------------------------------------
*/

const getApprovalReport = async (req, res) => {

    try {

        const {
            societyId,
            fromDate,
            toDate
        } = req.query;


        validateSocietyId(societyId);

        validateDateRange(
            fromDate,
            toDate
        );


        const data =
            await service.getApprovalReport({
                societyId,
                fromDate,
                toDate
            });


        res.status(200).json({
            success: true,
            message:
                "Approval report fetched successfully",
            data
        });

    } catch (error) {

        console.error(
            "Approval report error:",
            error
        );

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


/*
|--------------------------------------------------------------------------
| Approval Status
|--------------------------------------------------------------------------
*/

const getApprovalStatusReport = async (req, res) => {

    try {

        const {
            societyId,
            fromDate,
            toDate
        } = req.query;


        validateSocietyId(societyId);

        validateDateRange(
            fromDate,
            toDate
        );


        const data =
            await service.getApprovalStatusReport({
                societyId,
                fromDate,
                toDate
            });


        res.status(200).json({
            success: true,
            message:
                "Approval status report fetched successfully",
            data
        });

    } catch (error) {

        console.error(
            "Approval status report error:",
            error
        );

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


/*
|--------------------------------------------------------------------------
| SLA Report
|--------------------------------------------------------------------------
*/

const getSlaReport = async (req, res) => {

    try {

        const {
            societyId,
            fromDate,
            toDate
        } = req.query;


        validateSocietyId(societyId);

        validateDateRange(
            fromDate,
            toDate
        );


        const data =
            await service.getSlaReport({
                societyId,
                fromDate,
                toDate
            });


        res.status(200).json({
            success: true,
            message:
                "SLA report fetched successfully",
            data
        });

    } catch (error) {

        console.error(
            "SLA report error:",
            error
        );

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


/*
|--------------------------------------------------------------------------
| Payment Report
|--------------------------------------------------------------------------
*/

const getPaymentReport = async (req, res) => {

    try {

        const {
            societyId,
            fromDate,
            toDate
        } = req.query;


        validateSocietyId(societyId);

        validateDateRange(
            fromDate,
            toDate
        );


        const data =
            await service.getPaymentReport({
                societyId,
                fromDate,
                toDate
            });


        res.status(200).json({
            success: true,
            message:
                "Payment report fetched successfully",
            data
        });

    } catch (error) {

        console.error(
            "Payment report error:",
            error
        );

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {

    getApprovalsDashboard,

    getApprovalReport,

    getApprovalStatusReport,

    getSlaReport,

    getPaymentReport
};
