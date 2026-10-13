const service =
    require("./meetingAttendance.service");

const markAttendance = async (req, res) => {
    try {
        const data =
            await service.markAttendance(
                req.body
            );

        res.status(201).json({
            success: true,
            message: "Attendance recorded successfully",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getAttendance = async (req, res) => {
    try {
        const data =
            await service.getAttendance(
                req.query
            );

        res.status(200).json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getAttendanceById = async (req, res) => {
    try {
        const data =
            await service.getAttendanceById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

const checkOut = async (req, res) => {
    try {
        const data =
            await service.checkOut(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Check-out recorded",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const deleteAttendance = async (req, res) => {
    try {
        await service.deleteAttendance(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Attendance deleted successfully"
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    markAttendance,
    getAttendance,
    getAttendanceById,
    checkOut,
    deleteAttendance
};