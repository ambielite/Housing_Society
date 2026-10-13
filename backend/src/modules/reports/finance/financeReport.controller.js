const service =
    require("./financeReport.service");


/*
|--------------------------------------------------------------------------
| Complete Finance Dashboard
|--------------------------------------------------------------------------
*/

const getFinanceDashboard = async (
    req,
    res
) => {

    try {

        const result =
            await service.getFinanceDashboard({

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
                "Finance dashboard loaded successfully",

            data: result

        });

    }
    catch (error) {

        console.error(
            "Finance dashboard error:",
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
| Bank Balance
|--------------------------------------------------------------------------
*/

const getBankBalance = async (
    req,
    res
) => {

    try {

        const result =
            await service.getBankBalance({

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
                "Bank balance report loaded successfully",

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
| Collection
|--------------------------------------------------------------------------
*/

const getCollection = async (
    req,
    res
) => {

    try {

        const result =
            await service.getCollection({

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
                "Collection report loaded successfully",

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
| Arrears
|--------------------------------------------------------------------------
*/

const getArrears = async (
    req,
    res
) => {

    try {

        const result =
            await service.getArrears({

                societyId:
                    req.query.societyId

            });


        res.status(200).json({

            success: true,

            message:
                "Arrears report loaded successfully",

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
| Income vs Expense
|--------------------------------------------------------------------------
*/

const getIncomeExpense = async (
    req,
    res
) => {

    try {

        const result =
            await service.getIncomeExpense({

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
                "Income and expense report loaded successfully",

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

    getFinanceDashboard,

    getBankBalance,

    getCollection,

    getArrears,

    getIncomeExpense

};