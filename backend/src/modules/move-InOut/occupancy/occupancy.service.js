const repository = require("./occupancy.repository");

const createOccupancy = async (data) => {
    const existingOccupancy =
        await repository.findCurrentByUnit(
            data.unitId
        );

    if (existingOccupancy) {
        throw new Error(
            "Unit already has a current occupancy"
        );
    }

    return await repository.create({
        societyId: data.societyId,
        unitId: data.unitId,
        residentId: data.residentId,
        occupancyType: data.occupancyType,
        startDate: data.startDate,
        billingStartDate:
            data.billingStartDate ||
            data.startDate,
        endDate: null,
        billingEndDate: null,
        isCurrent: true
    });
};

const getOccupancies = async () => {
    return await repository.findAll();
};

const getOccupancy = async (id) => {
    return await repository.findById(id);
};

const getCurrentOccupancyByUnit = async (
    unitId
) => {
    return await repository.findCurrentByUnit(
        unitId
    );
};

const getOccupancyHistoryByUnit = async (
    unitId
) => {
    return await repository.findByUnit(
        unitId
    );
};

const getOccupancyHistoryByResident = async (
    residentId
) => {
    return await repository.findByResident(
        residentId
    );
};

const closeOccupancy = async (
    id,
    endDate
) => {
    const occupancy =
        await repository.findById(id);

    if (!occupancy) {
        return null;
    }

    if (!occupancy.isCurrent) {
        throw new Error(
            "Occupancy is already closed"
        );
    }

    if (
        new Date(endDate) <
        new Date(occupancy.startDate)
    ) {
        throw new Error(
            "End date cannot be before start date"
        );
    }

    return await repository.closeOccupancy(
        id,
        endDate
    );
};

const transferOccupancy = async (data) => {
    const {
        unitId,
        newResidentId,
        newOccupancyType,
        transferDate,
        societyId
    } = data;

    const currentOccupancy =
        await repository.findCurrentByUnit(
            unitId
        );

    if (currentOccupancy) {
        await repository.closeOccupancy(
            currentOccupancy.id,
            transferDate
        );
    }

    return await repository.create({
        societyId,
        unitId,
        residentId: newResidentId,
        occupancyType: newOccupancyType,
        startDate: transferDate,
        billingStartDate: transferDate,
        endDate: null,
        billingEndDate: null,
        isCurrent: true
    });
};

module.exports = {
    createOccupancy,
    getOccupancies,
    getOccupancy,
    getCurrentOccupancyByUnit,
    getOccupancyHistoryByUnit,
    getOccupancyHistoryByResident,
    closeOccupancy,
    transferOccupancy
};