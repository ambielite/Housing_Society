const repository =
    require("./accountingPeriod.repository");

const {
    validateCreatePeriod
} = require("./accountingPeriod.validation");


const createPeriod = async (data) => {

    const errors =
        validateCreatePeriod(data);

    if (errors.length > 0) {

        throw new Error(
            errors.join(", ")
        );

    }


    const overlappingPeriod =
        await repository.findOverlappingPeriod(
            data.societyId,
            data.startDate,
            data.endDate
        );


    if (overlappingPeriod) {

        throw new Error(
            "Accounting period overlaps with an existing period"
        );

    }


    return await repository.create({

        societyId: data.societyId,

        name: data.name,

        startDate: data.startDate,

        endDate: data.endDate,

        status: data.status || "OPEN",

        description:
            data.description || null,

        remarks:
            data.remarks || null

    });

};


const getAllPeriods = async (societyId) => {

    return await repository.findAll(
        societyId
    );

};


const getPeriodById = async (id) => {

    const period =
        await repository.findById(id);

    if (!period) {

        throw new Error(
            "Accounting period not found"
        );

    }

    return period;

};


const getPeriodsBySociety = async (
    societyId
) => {

    return await repository.findBySociety(
        societyId
    );

};


const getOpenPeriod = async (
    societyId
) => {

    return await repository.findOpenPeriod(
        societyId
    );

};


const getPeriodsByStatus = async (
    societyId,
    status
) => {

    return await repository.findByStatus(
        societyId,
        status
    );

};


const updatePeriod = async (
    id,
    data
) => {

    const period =
        await repository.findById(id);

    if (!period) {

        throw new Error(
            "Accounting period not found"
        );

    }


    if (period.status !== "OPEN") {

        throw new Error(
            "Only OPEN accounting periods can be updated"
        );

    }


    const startDate =
        data.startDate || period.startDate;

    const endDate =
        data.endDate || period.endDate;


    if (startDate > endDate) {

        throw new Error(
            "startDate cannot be greater than endDate"
        );

    }


    const overlappingPeriod =
        await repository.findOverlappingPeriod(
            period.societyId,
            startDate,
            endDate,
            id
        );


    if (overlappingPeriod) {

        throw new Error(
            "Accounting period overlaps with an existing period"
        );

    }


    return await repository.update(
        id,
        {

            name:
                data.name !== undefined
                    ? data.name
                    : period.name,

            startDate,

            endDate,

            description:
                data.description !== undefined
                    ? data.description
                    : period.description,

            remarks:
                data.remarks !== undefined
                    ? data.remarks
                    : period.remarks

        }
    );

};


const closePeriod = async (
    id,
    closedBy = null
) => {

    const period =
        await repository.findById(id);

    if (!period) {

        throw new Error(
            "Accounting period not found"
        );

    }


    if (period.status !== "OPEN") {

        throw new Error(
            "Only OPEN accounting periods can be closed"
        );

    }


    return await repository.update(
        id,
        {

            status: "CLOSED",

            closedAt: new Date(),

            closedBy

        }
    );

};


const lockPeriod = async (
    id,
    lockedBy = null
) => {

    const period =
        await repository.findById(id);

    if (!period) {

        throw new Error(
            "Accounting period not found"
        );

    }


    if (period.status !== "CLOSED") {

        throw new Error(
            "Only CLOSED accounting periods can be locked"
        );

    }


    return await repository.update(
        id,
        {

            status: "LOCKED",

            lockedAt: new Date(),

            lockedBy

        }
    );

};


const isPeriodOpenForDate = async (
    societyId,
    transactionDate
) => {

    const period =
        await repository.findOpenPeriod(
            societyId
        );

    if (!period) {

        return null;

    }


    if (
        transactionDate >= period.startDate &&
        transactionDate <= period.endDate
    ) {

        return period;

    }


    return null;

};


const deletePeriod = async (id) => {

    const period =
        await repository.findById(id);

    if (!period) {

        throw new Error(
            "Accounting period not found"
        );

    }


    if (period.status !== "OPEN") {

        throw new Error(
            "Only OPEN accounting periods can be deleted"
        );

    }


    return await repository.deleteById(
        id
    );

};


module.exports = {

    createPeriod,
    getAllPeriods,
    getPeriodById,
    getPeriodsBySociety,
    getOpenPeriod,
    getPeriodsByStatus,
    updatePeriod,
    closePeriod,
    lockPeriod,
    isPeriodOpenForDate,
    deletePeriod

};