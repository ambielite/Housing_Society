const service =
    require("./operationsReport.service");


/*
|--------------------------------------------------------------------------
| Complete Operations Dashboard
|--------------------------------------------------------------------------
*/

const getOperationsDashboard = async (
    req,
    res
) => {

    try {

        const result =
            await service.getOperationsDashboard({

                societyId:
                    req.query.societyId,

                fromDate:
                    req.query.fromDate,

                toDate:
                    req.query.toDate

            });


        res.status(200).json({

            success: true,

            message:
                "Operations dashboard loaded successfully",

            data: result

        });

    }
    catch (error) {

        console.error(
            "Operations dashboard error:",
            error
        );


        res.status(400).json({

            success: false,

            message:
                error.message

        });
    }
};


/*
|--------------------------------------------------------------------------
| Occupancy
|--------------------------------------------------------------------------
*/

const getOccupancyReport = async (
    req,
    res
) => {

    try {

        const result =
            await service.getOccupancyReport({

                societyId:
                    req.query.societyId

            });


        res.status(200).json({

            success: true,

            message:
                "Occupancy report loaded successfully",

            data: result

        });

    }
    catch (error) {

        res.status(400).json({

            success: false,

            message:
                error.message

        });
    }
};


/*
|--------------------------------------------------------------------------
| Residents
|--------------------------------------------------------------------------
*/

const getResidentReport = async (
    req,
    res
) => {

    try {

        const result =
            await service.getResidentReport({

                societyId:
                    req.query.societyId

            });


        res.status(200).json({

            success: true,

            message:
                "Resident report loaded successfully",

            data: result

        });

    }
    catch (error) {

        res.status(400).json({

            success: false,

            message:
                error.message

        });
    }
};


/*
|--------------------------------------------------------------------------
| Vehicles
|--------------------------------------------------------------------------
*/

const getVehicleReport = async (
    req,
    res
) => {

    try {

        const result =
            await service.getVehicleReport({

                societyId:
                    req.query.societyId

            });


        res.status(200).json({

            success: true,

            message:
                "Vehicle report loaded successfully",

            data: result

        });

    }
    catch (error) {

        res.status(400).json({

            success: false,

            message:
                error.message

        });
    }
};


/*
|--------------------------------------------------------------------------
| Parking
|--------------------------------------------------------------------------
*/

const getParkingReport = async (
    req,
    res
) => {

    try {

        const result =
            await service.getParkingReport({

                societyId:
                    req.query.societyId

            });


        res.status(200).json({

            success: true,

            message:
                "Parking report loaded successfully",

            data: result

        });

    }
    catch (error) {

        res.status(400).json({

            success: false,

            message:
                error.message

        });
    }
};


module.exports = {

    getOperationsDashboard,

    getOccupancyReport,

    getResidentReport,

    getVehicleReport,

    getParkingReport

};