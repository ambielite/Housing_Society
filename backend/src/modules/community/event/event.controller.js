const service = require("./event.service");


const createEvent = async (req, res) => {

    try {

        const event =
            await service.createEvent(req.body);

        res.status(201).json({
            success: true,
            message: "Event created successfully",
            data: event
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getEvents = async (req, res) => {

    try {

        const events =
            await service.getEvents(req.query);

        res.status(200).json({
            success: true,
            count: events.length,
            data: events
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getEventById = async (req, res) => {

    try {

        const event =
            await service.getEventById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: event
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const updateEvent = async (req, res) => {

    try {

        const event =
            await service.updateEvent(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Event updated successfully",
            data: event
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const submitEventForApproval = async (req, res) => {

    try {

        const event =
            await service.submitEventForApproval(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Event submitted for approval",
            data: event
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const approveEvent = async (req, res) => {

    try {

        const event =
            await service.approveEvent(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Event approved successfully",
            data: event
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const publishEvent = async (req, res) => {

    try {

        const event =
            await service.publishEvent(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Event published successfully",
            data: event
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const cancelEvent = async (req, res) => {

    try {

        const event =
            await service.cancelEvent(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Event cancelled successfully",
            data: event
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const completeEvent = async (req, res) => {

    try {

        const event =
            await service.completeEvent(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Event completed successfully",
            data: event
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteEvent = async (req, res) => {

    try {

        await service.deleteEvent(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Event deleted successfully"
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    submitEventForApproval,
    approveEvent,
    publishEvent,
    cancelEvent,
    completeEvent,
    deleteEvent
};