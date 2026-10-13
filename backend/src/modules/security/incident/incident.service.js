const incidentRepository = require("./incident.repository");

const Society = require("../../societies/society/society.model");
const Staff = require("../staff/staff.model");
const Unit = require("../../societies/unit/unit.model");


const createIncident = async (data) => {

    const errors = [];

    if (!data.societyId) {
        errors.push("societyId is required");
    }

    if (!data.incidentNumber) {
        errors.push("incidentNumber is required");
    }

    if (!data.incidentType) {
        errors.push("incidentType is required");
    }

    if (!data.title) {
        errors.push("title is required");
    }

    if (!data.description) {
        errors.push("description is required");
    }

    if (!data.incidentDate) {
        errors.push("incidentDate is required");
    }

    if (errors.length > 0) {
        throw new Error(errors.join(", "));
    }


    const society = await Society.findByPk(
        data.societyId
    );

    if (!society) {
        throw new Error("Society not found");
    }


    const existingIncident =
        await incidentRepository.findOne({
            societyId: data.societyId,
            incidentNumber: data.incidentNumber
        });

    if (existingIncident) {
        throw new Error(
            "Incident number already exists"
        );
    }


    if (data.assignedTo) {

        const staff = await Staff.findByPk(
            data.assignedTo
        );

        if (!staff) {
            throw new Error(
                "Assigned staff not found"
            );
        }

        if (staff.societyId !== data.societyId) {
            throw new Error(
                "Assigned staff does not belong to this society"
            );
        }
    }


    if (data.unitId) {

        const unit = await Unit.findByPk(
            data.unitId
        );

        if (!unit) {
            throw new Error("Unit not found");
        }
    }


    return await incidentRepository.create(data);
};


const getAllIncidents = async (filters = {}) => {

    const where = {};

    if (filters.societyId) {
        where.societyId = filters.societyId;
    }

    if (filters.incidentType) {
        where.incidentType =
            filters.incidentType;
    }

    if (filters.severity) {
        where.severity =
            filters.severity;
    }

    if (filters.status) {
        where.status =
            filters.status;
    }

    if (filters.priority) {
        where.priority =
            filters.priority;
    }

    if (filters.unitId) {
        where.unitId =
            filters.unitId;
    }

    if (filters.assignedTo) {
        where.assignedTo =
            filters.assignedTo;
    }

    return await incidentRepository.findAll(
        where
    );
};


const getIncidentById = async (id) => {

    const incident =
        await incidentRepository.findById(id);

    if (!incident) {
        throw new Error("Incident not found");
    }

    return incident;
};


const updateIncident = async (id, data) => {

    const incident =
        await incidentRepository.findById(id);

    if (!incident) {
        throw new Error("Incident not found");
    }


    if (data.assignedTo) {

        const staff = await Staff.findByPk(
            data.assignedTo
        );

        if (!staff) {
            throw new Error(
                "Assigned staff not found"
            );
        }

        if (
            staff.societyId !==
            incident.societyId
        ) {
            throw new Error(
                "Assigned staff does not belong to this society"
            );
        }
    }


    if (data.unitId) {

        const unit = await Unit.findByPk(
            data.unitId
        );

        if (!unit) {
            throw new Error("Unit not found");
        }
    }


    return await incidentRepository.update(
        incident,
        data
    );
};


const acknowledgeIncident = async (id) => {

    const incident =
        await getIncidentById(id);

    if (
        incident.status === "CLOSED" ||
        incident.status === "REJECTED"
    ) {
        throw new Error(
            "Closed or rejected incident cannot be acknowledged"
        );
    }

    return await incidentRepository.update(
        incident,
        {
            status: "ACKNOWLEDGED"
        }
    );
};


const startInvestigation = async (
    id,
    data = {}
) => {

    const incident =
        await getIncidentById(id);

    if (
        incident.status === "CLOSED" ||
        incident.status === "REJECTED"
    ) {
        throw new Error(
            "Investigation cannot be started"
        );
    }

    return await incidentRepository.update(
        incident,
        {
            status: "UNDER_INVESTIGATION",
            assignedTo:
                data.assignedTo ||
                incident.assignedTo,
            investigationNotes:
                data.investigationNotes ||
                incident.investigationNotes
        }
    );
};


const resolveIncident = async (
    id,
    data
) => {

    const incident =
        await getIncidentById(id);

    if (
        incident.status === "CLOSED" ||
        incident.status === "REJECTED"
    ) {
        throw new Error(
            "Incident cannot be resolved"
        );
    }

    if (!data.resolutionDetails) {
        throw new Error(
            "resolutionDetails is required"
        );
    }

    return await incidentRepository.update(
        incident,
        {
            status: "RESOLVED",
            resolutionDetails:
                data.resolutionDetails,
            resolvedAt: new Date()
        }
    );
};


const closeIncident = async (id) => {

    const incident =
        await getIncidentById(id);

    if (incident.status !== "RESOLVED") {
        throw new Error(
            "Only resolved incidents can be closed"
        );
    }

    return await incidentRepository.update(
        incident,
        {
            status: "CLOSED",
            closedAt: new Date()
        }
    );
};


const rejectIncident = async (
    id,
    data = {}
) => {

    const incident =
        await getIncidentById(id);

    if (incident.status === "CLOSED") {
        throw new Error(
            "Closed incident cannot be rejected"
        );
    }

    return await incidentRepository.update(
        incident,
        {
            status: "REJECTED",
            remarks:
                data.remarks ||
                incident.remarks
        }
    );
};


const assignIncident = async (
    id,
    staffId
) => {

    const incident =
        await getIncidentById(id);

    if (!staffId) {
        throw new Error(
            "staffId is required"
        );
    }

    const staff = await Staff.findByPk(
        staffId
    );

    if (!staff) {
        throw new Error("Staff not found");
    }

    if (
        staff.societyId !==
        incident.societyId
    ) {
        throw new Error(
            "Staff does not belong to this society"
        );
    }

    return await incidentRepository.update(
        incident,
        {
            assignedTo: staffId
        }
    );
};


const deleteIncident = async (id) => {

    const incident =
        await getIncidentById(id);

    if (
        incident.status ===
            "UNDER_INVESTIGATION" ||
        incident.status === "RESOLVED" ||
        incident.status === "CLOSED"
    ) {
        throw new Error(
            "Incident cannot be deleted in current status"
        );
    }

    return await incidentRepository.deleteIncident(
        incident
    );
};


module.exports = {
    createIncident,
    getAllIncidents,
    getIncidentById,
    updateIncident,
    acknowledgeIncident,
    startInvestigation,
    resolveIncident,
    closeIncident,
    rejectIncident,
    assignIncident,
    deleteIncident
};