const emergencyRepository =
    require("./emergency.repository");


const Society =
    require("../../societies/society/society.model");

const Staff =
    require("../staff/staff.model");

const Unit =
    require("../../societies/unit/unit.model");


const createEmergency = async (data) => {

    const errors = [];


    if (!data.societyId) {
        errors.push("societyId is required");
    }


    if (!data.emergencyNumber) {
        errors.push(
            "emergencyNumber is required"
        );
    }


    if (!data.emergencyType) {
        errors.push(
            "emergencyType is required"
        );
    }


    if (!data.title) {
        errors.push("title is required");
    }


    if (!data.description) {
        errors.push(
            "description is required"
        );
    }


    if (errors.length > 0) {
        throw new Error(
            errors.join(", ")
        );
    }


    const society =
        await Society.findByPk(
            data.societyId
        );


    if (!society) {
        throw new Error(
            "Society not found"
        );
    }


    const existingEmergency =
        await emergencyRepository.findOne({
            societyId:
                data.societyId,

            emergencyNumber:
                data.emergencyNumber
        });


    if (existingEmergency) {
        throw new Error(
            "Emergency number already exists"
        );
    }


    if (data.reportedBy) {

        const staff =
            await Staff.findByPk(
                data.reportedBy
            );


        if (!staff) {
            throw new Error(
                "Reporting staff not found"
            );
        }


        if (
            staff.societyId !==
            data.societyId
        ) {
            throw new Error(
                "Reporting staff does not belong to this society"
            );
        }
    }


    if (data.assignedTo) {

        const staff =
            await Staff.findByPk(
                data.assignedTo
            );


        if (!staff) {
            throw new Error(
                "Assigned staff not found"
            );
        }


        if (
            staff.societyId !==
            data.societyId
        ) {
            throw new Error(
                "Assigned staff does not belong to this society"
            );
        }
    }


    if (data.unitId) {

        const unit =
            await Unit.findByPk(
                data.unitId
            );


        if (!unit) {
            throw new Error(
                "Unit not found"
            );
        }
    }


    return await emergencyRepository.create(
        data
    );
};


const getAllEmergencies = async (
    filters = {}
) => {

    const where = {};


    if (filters.societyId) {
        where.societyId =
            filters.societyId;
    }


    if (filters.emergencyType) {
        where.emergencyType =
            filters.emergencyType;
    }


    if (filters.priority) {
        where.priority =
            filters.priority;
    }


    if (filters.status) {
        where.status =
            filters.status;
    }


    if (filters.assignedTo) {
        where.assignedTo =
            filters.assignedTo;
    }


    if (filters.unitId) {
        where.unitId =
            filters.unitId;
    }


    return await emergencyRepository.findAll(
        where
    );
};


const getEmergencyById = async (id) => {

    const emergency =
        await emergencyRepository.findById(
            id
        );


    if (!emergency) {
        throw new Error(
            "Emergency not found"
        );
    }


    return emergency;
};


const updateEmergency = async (
    id,
    data
) => {

    const emergency =
        await getEmergencyById(id);


    if (data.assignedTo) {

        const staff =
            await Staff.findByPk(
                data.assignedTo
            );


        if (!staff) {
            throw new Error(
                "Assigned staff not found"
            );
        }


        if (
            staff.societyId !==
            emergency.societyId
        ) {
            throw new Error(
                "Assigned staff does not belong to this society"
            );
        }
    }


    return await emergencyRepository.update(
        emergency,
        data
    );
};


const acknowledgeEmergency = async (
    id
) => {

    const emergency =
        await getEmergencyById(id);


    if (
        emergency.status === "CLOSED" ||
        emergency.status === "CANCELLED" ||
        emergency.status === "FALSE_ALARM"
    ) {
        throw new Error(
            "Emergency cannot be acknowledged in current status"
        );
    }


    return await emergencyRepository.update(
        emergency,
        {
            status: "ACKNOWLEDGED",
            acknowledgedAt: new Date()
        }
    );
};


const startResponse = async (
    id,
    data = {}
) => {

    const emergency =
        await getEmergencyById(id);


    if (
        emergency.status === "CLOSED" ||
        emergency.status === "CANCELLED" ||
        emergency.status === "FALSE_ALARM"
    ) {
        throw new Error(
            "Response cannot be started"
        );
    }


    const updateData = {
        status: "RESPONDING",
        responseStartedAt:
            new Date()
    };


    if (data.responseNotes) {

        updateData.responseNotes =
            data.responseNotes;
    }


    if (data.assignedTo) {

        const staff =
            await Staff.findByPk(
                data.assignedTo
            );


        if (!staff) {
            throw new Error(
                "Assigned staff not found"
            );
        }


        if (
            staff.societyId !==
            emergency.societyId
        ) {
            throw new Error(
                "Assigned staff does not belong to this society"
            );
        }


        updateData.assignedTo =
            data.assignedTo;
    }


    return await emergencyRepository.update(
        emergency,
        updateData
    );
};


const resolveEmergency = async (
    id,
    data
) => {

    const emergency =
        await getEmergencyById(id);


    if (
        emergency.status === "CLOSED" ||
        emergency.status === "CANCELLED" ||
        emergency.status === "FALSE_ALARM"
    ) {
        throw new Error(
            "Emergency cannot be resolved"
        );
    }


    if (!data.resolutionDetails) {
        throw new Error(
            "resolutionDetails is required"
        );
    }


    return await emergencyRepository.update(
        emergency,
        {
            status: "RESOLVED",

            resolutionDetails:
                data.resolutionDetails,

            resolvedAt: new Date()
        }
    );
};


const closeEmergency = async (id) => {

    const emergency =
        await getEmergencyById(id);


    if (
        emergency.status !== "RESOLVED"
    ) {
        throw new Error(
            "Only resolved emergencies can be closed"
        );
    }


    return await emergencyRepository.update(
        emergency,
        {
            status: "CLOSED",
            closedAt: new Date()
        }
    );
};


const cancelEmergency = async (
    id,
    data = {}
) => {

    const emergency =
        await getEmergencyById(id);


    if (emergency.status === "CLOSED") {
        throw new Error(
            "Closed emergency cannot be cancelled"
        );
    }


    return await emergencyRepository.update(
        emergency,
        {
            status: "CANCELLED",

            remarks:
                data.remarks ||
                emergency.remarks
        }
    );
};


const markFalseAlarm = async (
    id,
    data = {}
) => {

    const emergency =
        await getEmergencyById(id);


    if (emergency.status === "CLOSED") {
        throw new Error(
            "Closed emergency cannot be marked as false alarm"
        );
    }


    return await emergencyRepository.update(
        emergency,
        {
            status: "FALSE_ALARM",

            remarks:
                data.remarks ||
                emergency.remarks
        }
    );
};


const assignEmergency = async (
    id,
    staffId
) => {

    const emergency =
        await getEmergencyById(id);


    if (!staffId) {
        throw new Error(
            "staffId is required"
        );
    }


    const staff =
        await Staff.findByPk(
            staffId
        );


    if (!staff) {
        throw new Error(
            "Staff not found"
        );
    }


    if (
        staff.societyId !==
        emergency.societyId
    ) {
        throw new Error(
            "Staff does not belong to this society"
        );
    }


    return await emergencyRepository.update(
        emergency,
        {
            assignedTo: staffId
        }
    );
};


const updateEmergencyContacts = async (
    id,
    data
) => {

    const emergency =
        await getEmergencyById(id);


    return await emergencyRepository.update(
        emergency,
        {
            policeContacted:
                data.policeContacted !==
                undefined
                    ? data.policeContacted
                    : emergency.policeContacted,

            ambulanceContacted:
                data.ambulanceContacted !==
                undefined
                    ? data.ambulanceContacted
                    : emergency.ambulanceContacted,

            fireBrigadeContacted:
                data.fireBrigadeContacted !==
                undefined
                    ? data.fireBrigadeContacted
                    : emergency.fireBrigadeContacted,

            emergencyContacted:
                data.emergencyContacted !==
                undefined
                    ? data.emergencyContacted
                    : emergency.emergencyContacted,

            externalReference:
                data.externalReference ||
                emergency.externalReference,

            remarks:
                data.remarks ||
                emergency.remarks
        }
    );
};


const deleteEmergency = async (id) => {

    const emergency =
        await getEmergencyById(id);


    if (
        emergency.status ===
            "RESPONDING" ||
        emergency.status ===
            "RESOLVED" ||
        emergency.status ===
            "CLOSED"
    ) {
        throw new Error(
            "Emergency cannot be deleted in current status"
        );
    }


    return await emergencyRepository.deleteEmergency(
        emergency
    );
};


module.exports = {
    createEmergency,
    getAllEmergencies,
    getEmergencyById,
    updateEmergency,
    acknowledgeEmergency,
    startResponse,
    resolveEmergency,
    closeEmergency,
    cancelEmergency,
    markFalseAlarm,
    assignEmergency,
    updateEmergencyContacts,
    deleteEmergency
};