const RosterService =
    require("./roster.service");


const createRoster = async (
    req,
    res
) => {

    try {

        const result =
            await RosterService.createRoster(
                req.body
            );

        return res.status(201).json({
            success: true,
            message:
                "Roster created successfully",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getAllRosters = async (
    req,
    res
) => {

    try {

        const filters = {};

        if (req.query.societyId) {
            filters.societyId =
                req.query.societyId;
        }

        if (req.query.staffId) {
            filters.staffId =
                req.query.staffId;
        }

        if (req.query.shiftId) {
            filters.shiftId =
                req.query.shiftId;
        }

        if (req.query.rosterDate) {
            filters.rosterDate =
                req.query.rosterDate;
        }

        if (req.query.status) {
            filters.status =
                req.query.status;
        }

        const result =
            await RosterService
                .getAllRosters(filters);

        return res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getRosterById = async (
    req,
    res
) => {

    try {

        const result =
            await RosterService
                .getRosterById(
                    req.params.id
                );

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const getRostersByStaff = async (
    req,
    res
) => {

    try {

        const result =
            await RosterService
                .getRostersByStaff(
                    req.params.staffId
                );

        return res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const getRostersByDate = async (
    req,
    res
) => {

    try {

        const result =
            await RosterService
                .getRostersByDate(
                    req.params.date
                );

        return res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const updateRoster = async (
    req,
    res
) => {

    try {

        const result =
            await RosterService
                .updateRoster(
                    req.params.id,
                    req.body
                );

        return res.status(200).json({
            success: true,
            message:
                "Roster updated successfully",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const confirmRoster = async (
    req,
    res
) => {

    try {

        const result =
            await RosterService
                .confirmRoster(
                    req.params.id
                );

        return res.status(200).json({
            success: true,
            message:
                "Roster confirmed successfully",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const cancelRoster = async (
    req,
    res
) => {

    try {

        const result =
            await RosterService
                .cancelRoster(
                    req.params.id
                );

        return res.status(200).json({
            success: true,
            message:
                "Roster cancelled successfully",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const completeRoster = async (
    req,
    res
) => {

    try {

        const result =
            await RosterService
                .completeRoster(
                    req.params.id
                );

        return res.status(200).json({
            success: true,
            message:
                "Roster completed successfully",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteRoster = async (
    req,
    res
) => {

    try {

        const result =
            await RosterService
                .deleteRoster(
                    req.params.id
                );

        return res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    createRoster,
    getAllRosters,
    getRosterById,
    getRostersByStaff,
    getRostersByDate,
    updateRoster,
    confirmRoster,
    cancelRoster,
    completeRoster,
    deleteRoster
};