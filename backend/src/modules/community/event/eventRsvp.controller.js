const service =
    require("./eventRsvp.service");


const registerForEvent = async (req, res) => {

    try {

        const rsvp =
            await service.registerForEvent(
                {
                    ...req.body,
                    eventId: req.params.eventId
                }
            );

        res.status(201).json({
            success: true,
            message: "Event registration successful",
            data: rsvp
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getRsvps = async (req, res) => {

    try {

        const rsvps =
            await service.getRsvps(req.query);

        res.status(200).json({
            success: true,
            count: rsvps.length,
            data: rsvps
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getRsvpById = async (req, res) => {

    try {

        const rsvp =
            await service.getRsvpById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: rsvp
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const cancelRsvp = async (req, res) => {

    try {

        const rsvp =
            await service.cancelRsvp(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "RSVP cancelled successfully",
            data: rsvp
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const markPaymentPaid = async (req, res) => {

    try {

        const rsvp =
            await service.markPaymentPaid(
                req.params.id,
                req.body.paymentReference
            );

        res.status(200).json({
            success: true,
            message: "Payment marked as paid",
            data: rsvp
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const markPaymentFailed = async (req, res) => {

    try {

        const rsvp =
            await service.markPaymentFailed(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Payment marked as failed",
            data: rsvp
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const checkIn = async (req, res) => {

    try {

        const rsvp =
            await service.checkIn(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "User checked in successfully",
            data: rsvp
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const markNoShow = async (req, res) => {

    try {

        const rsvp =
            await service.markNoShow(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "RSVP marked as no-show",
            data: rsvp
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteRsvp = async (req, res) => {

    try {

        await service.deleteRsvp(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "RSVP deleted successfully"
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    registerForEvent,
    getRsvps,
    getRsvpById,
    cancelRsvp,
    markPaymentPaid,
    markPaymentFailed,
    checkIn,
    markNoShow,
    deleteRsvp
};