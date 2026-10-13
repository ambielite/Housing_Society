const meetingRepository =
    require("./meeting.repository");

const agendaRepository =
    require("./meetingAgenda.repository");

const repository =
    require("./meetingActionItem.repository");

const {
    validateActionItem
} = require("./meeting.validation");


const createActionItem = async (data) => {

    validateActionItem(data);

    const meeting =
        await meetingRepository.findById(
            data.meetingId
        );

    if (!meeting) {
        throw new Error("Meeting not found");
    }

    if (data.agendaId) {

        const agenda =
            await agendaRepository.findById(
                data.agendaId
            );

        if (!agenda) {
            throw new Error(
                "Agenda item not found"
            );
        }

        if (
            agenda.meetingId !==
            data.meetingId
        ) {
            throw new Error(
                "Agenda does not belong to this meeting"
            );
        }
    }

    return await repository.create({
        ...data,
        status: "OPEN"
    });
};


const getActionItems = async (
    filters = {}
) => {

    const where = {};

    if (filters.meetingId) {
        where.meetingId =
            filters.meetingId;
    }

    if (filters.agendaId) {
        where.agendaId =
            filters.agendaId;
    }

    if (filters.assignedTo) {
        where.assignedTo =
            filters.assignedTo;
    }

    if (filters.status) {
        where.status =
            filters.status;
    }

    if (filters.priority) {
        where.priority =
            filters.priority;
    }

    return await repository.findAll(where);
};


const getActionItemById = async (id) => {

    const item =
        await repository.findById(id);

    if (!item) {
        throw new Error(
            "Action item not found"
        );
    }

    return item;
};


const updateActionItem = async (
    id,
    data
) => {

    const item =
        await getActionItemById(id);

    if (item.status === "CANCELLED") {
        throw new Error(
            "Cancelled action item cannot be updated"
        );
    }

    return await repository.update(
        item,
        data
    );
};


const startActionItem = async (id) => {

    const item =
        await getActionItemById(id);

    if (
        item.status !== "OPEN"
    ) {
        throw new Error(
            "Only open action items can be started"
        );
    }

    return await repository.update(
        item,
        {
            status: "IN_PROGRESS"
        }
    );
};


const completeActionItem = async (
    id,
    completionNote
) => {

    const item =
        await getActionItemById(id);

    if (
        item.status === "COMPLETED"
    ) {
        throw new Error(
            "Action item is already completed"
        );
    }

    if (
        item.status === "CANCELLED"
    ) {
        throw new Error(
            "Cancelled action item cannot be completed"
        );
    }

    return await repository.update(
        item,
        {
            status: "COMPLETED",
            completedAt: new Date(),
            completionNote:
                completionNote || null
        }
    );
};


const cancelActionItem = async (id) => {

    const item =
        await getActionItemById(id);

    if (
        item.status === "COMPLETED"
    ) {
        throw new Error(
            "Completed action item cannot be cancelled"
        );
    }

    return await repository.update(
        item,
        {
            status: "CANCELLED"
        }
    );
};


const deleteActionItem = async (id) => {

    const item =
        await getActionItemById(id);

    if (
        item.status === "COMPLETED"
    ) {
        throw new Error(
            "Completed action item cannot be deleted"
        );
    }

    return await repository.deleteActionItem(
        item
    );
};


module.exports = {
    createActionItem,
    getActionItems,
    getActionItemById,
    updateActionItem,
    startActionItem,
    completeActionItem,
    cancelActionItem,
    deleteActionItem
};