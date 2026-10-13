
const service =
    require("./dashboard.service");


const getExecutiveDashboard = async (
    req,
    res
) => {

    try {

        const result =
            await service.getExecutiveDashboard(
                {
                    societyId:
                        req.query.societyId,

                    fromDate:
                        req.query.fromDate,

                    toDate:
                        req.query.toDate
                }
            );

        res.status(200).json({

            success: true,

            message:
                "Executive dashboard loaded successfully",

            data: result

        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message:
                error.message

        });

    }
};


module.exports = {
    getExecutiveDashboard
};

