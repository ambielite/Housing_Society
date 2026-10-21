const service =
    require("./accountingPeriod.service");


const create = async (req, res) => {

    try {

        const period =
            await service.createPeriod(
                req.body
            );

        return res.status(201).json({

            success: true,

            message:
                "Accounting period created successfully",

            data: period

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

};


const getAll = async (req, res) => {

    try {

        const periods =
            await service.getAllPeriods(
                req.query.societyId
            );

        return res.status(200).json({

            success: true,

            count: periods.length,

            data: periods

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


const getBySociety = async (
    req,
    res
) => {

    try {

        const periods =
            await service.getPeriodsBySociety(
                req.params.societyId
            );

        return res.status(200).json({

            success: true,

            count: periods.length,

            data: periods

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


const getOpen = async (
    req,
    res
) => {

    try {

        const period =
            await service.getOpenPeriod(
                req.params.societyId
            );

        return res.status(200).json({

            success: true,

            data: period

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


const getByStatus = async (
    req,
    res
) => {

    try {

        const periods =
            await service.getPeriodsByStatus(
                req.params.societyId,
                req.params.status
            );

        return res.status(200).json({

            success: true,

            count: periods.length,

            data: periods

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


const getById = async (
    req,
    res
) => {

    try {

        const period =
            await service.getPeriodById(
                req.params.id
            );

        return res.status(200).json({

            success: true,

            data: period

        });

    } catch (error) {

        return res.status(404).json({

            success: false,

            message: error.message

        });

    }

};


const update = async (
    req,
    res
) => {

    try {

        const period =
            await service.updatePeriod(
                req.params.id,
                req.body
            );

        return res.status(200).json({

            success: true,

            message:
                "Accounting period updated successfully",

            data: period

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

};


const close = async (
    req,
    res
) => {

    try {

        const period =
            await service.closePeriod(
                req.params.id,
                req.user?.id || null
            );

        return res.status(200).json({

            success: true,

            message:
                "Accounting period closed successfully",

            data: period

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

};


const lock = async (
    req,
    res
) => {

    try {

        const period =
            await service.lockPeriod(
                req.params.id,
                req.user?.id || null
            );

        return res.status(200).json({

            success: true,

            message:
                "Accounting period locked successfully",

            data: period

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

};


const remove = async (
    req,
    res
) => {

    try {

        await service.deletePeriod(
            req.params.id
        );

        return res.status(200).json({

            success: true,

            message:
                "Accounting period deleted successfully"

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

};


module.exports = {

    create,
    getAll,
    getBySociety,
    getOpen,
    getByStatus,
    getById,
    update,
    close,
    lock,
    remove

};
