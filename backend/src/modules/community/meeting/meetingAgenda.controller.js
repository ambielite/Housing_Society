const service =
    require("./meetingAgenda.service");

const createAgenda = async (req, res) => {
    try {
        const data =
            await service.createAgenda(req.body);

        res.status(201).json({
            success: true,
            message: "Agenda created successfully",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getAgendas = async (req, res) => {
    try {
        const data =
            await service.getAgendas(
                req.params.meetingId
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

const getAgendaById = async (req, res) => {
    try {
        const data =
            await service.getAgendaById(
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

const updateAgenda = async (req, res) => {
    try {
        const data =
            await service.updateAgenda(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Agenda updated successfully",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const updateAgendaStatus = async (req, res) => {
    try {
        const data =
            await service.updateAgendaStatus(
                req.params.id,
                req.body.status
            );

        res.status(200).json({
            success: true,
            message: "Agenda status updated",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const deleteAgenda = async (req, res) => {
    try {
        await service.deleteAgenda(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Agenda deleted successfully"
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createAgenda,
    getAgendas,
    getAgendaById,
    updateAgenda,
    updateAgendaStatus,
    deleteAgenda
};