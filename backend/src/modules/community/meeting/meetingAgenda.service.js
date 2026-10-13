const meetingRepository =
    require("./meeting.repository");

const repository =
    require("./meetingAgenda.repository");

const {
    validateAgenda
} = require("./meeting.validation");


const createAgenda = async (data) => {

    validateAgenda(data);

    const meeting =
        await meetingRepository.findById(
            data.meetingId
        );

    if (!meeting) {
        throw new Error("Meeting not found");
    }

    if (
        meeting.status === "COMPLETED" ||
        meeting.status === "CANCELLED"
    ) {
        throw new Error(
            "Agenda cannot be added to this meeting"
        );
    }

    return await repository.create(data);
};


const getAgendas = async (meetingId) => {

    return await repository.findAll({
        meetingId
    });
};


const getAgendaById = async (id) => {

    const agenda =
        await repository.findById(id);

    if (!agenda) {
        throw new Error("Agenda item not found");
    }

    return agenda;
};


const updateAgenda = async (
    id,
    data
) => {

    const agenda =
        await getAgendaById(id);

    return await repository.update(
        agenda,
        data
    );
};


const updateAgendaStatus = async (
    id,
    status
) => {

    const validStatuses = [
        "OPEN",
        "DISCUSSED",
        "DEFERRED",
        "CLOSED"
    ];

    if (!validStatuses.includes(status)) {
        throw new Error(
            "Invalid agenda status"
        );
    }

    const agenda =
        await getAgendaById(id);

    return await repository.update(
        agenda,
        { status }
    );
};


const deleteAgenda = async (id) => {

    const agenda =
        await getAgendaById(id);

    return await repository.deleteAgenda(
        agenda
    );
};


module.exports = {
    createAgenda,
    getAgendas,
    getAgendaById,
    updateAgenda,
    updateAgendaStatus,
    deleteAgenda
};