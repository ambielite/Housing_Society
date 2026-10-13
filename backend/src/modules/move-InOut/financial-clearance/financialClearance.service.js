const repository =
    require("./financialClearance.repository");


const createFinancialClearance = async (data) => {

    const existing =
        await repository.findCurrentByLifecycle(
            data.lifecycleId
        );

    if (existing) {
        throw new Error(
            "Financial clearance already exists for this move-out"
        );
    }

    const outstandingAmount =
        data.outstandingAmount !== undefined
            ? Number(data.outstandingAmount)
            : 0;


    if (outstandingAmount < 0) {
        throw new Error(
            "Outstanding amount cannot be negative"
        );
    }


    return await repository.create({

        societyId: data.societyId,

        unitId: data.unitId,

        residentId: data.residentId,

        lifecycleType: "MOVE_OUT",

        lifecycleId: data.lifecycleId,

        outstandingAmount,

        clearanceStatus: "PENDING",

        clearedBy: null,

        clearedAt: null,

        remarks: data.remarks || null
    });
};


const getFinancialClearances = async () => {

    return await repository.findAll();
};


const getFinancialClearance = async (id) => {

    const clearance =
        await repository.findById(id);

    if (!clearance) {
        throw new Error(
            "Financial clearance not found"
        );
    }

    return clearance;
};


const getPendingClearances = async () => {

    return await repository.findPending();
};


const getClearancesByLifecycle = async (
    lifecycleId
) => {

    return await repository.findByLifecycle(
        lifecycleId
    );
};


const clearFinancialClearance = async (
    id,
    clearedBy,
    remarks
) => {

    const clearance =
        await repository.findById(id);


    if (!clearance) {
        throw new Error(
            "Financial clearance not found"
        );
    }


    if (clearance.clearanceStatus !== "PENDING") {
        throw new Error(
            `Financial clearance cannot be cleared because current status is ${clearance.clearanceStatus}`
        );
    }


    const amount =
        Number(clearance.outstandingAmount);


    if (amount > 0) {
        throw new Error(
            "Financial clearance cannot be completed while outstanding amount is greater than zero"
        );
    }


    return await repository.update(id, {

        clearanceStatus: "CLEARED",

        clearedBy,

        clearedAt: new Date(),

        remarks: remarks || null
    });
};


const putOnHold = async (
    id,
    remarks
) => {

    const clearance =
        await repository.findById(id);


    if (!clearance) {
        throw new Error(
            "Financial clearance not found"
        );
    }


    if (clearance.clearanceStatus !== "PENDING") {
        throw new Error(
            `Financial clearance cannot be put on hold because current status is ${clearance.clearanceStatus}`
        );
    }


    if (!remarks || remarks.trim() === "") {
        throw new Error(
            "Remarks are required when putting financial clearance on hold"
        );
    }


    return await repository.update(id, {

        clearanceStatus: "HOLD",

        remarks
    });
};


const updateOutstandingAmount = async (
    id,
    outstandingAmount,
    remarks
) => {

    const clearance =
        await repository.findById(id);


    if (!clearance) {
        throw new Error(
            "Financial clearance not found"
        );
    }


    if (clearance.clearanceStatus === "CLEARED") {
        throw new Error(
            "Cannot update outstanding amount after financial clearance"
        );
    }


    const amount =
        Number(outstandingAmount);


    if (isNaN(amount) || amount < 0) {
        throw new Error(
            "Outstanding amount must be a valid non-negative number"
        );
    }


    return await repository.update(id, {

        outstandingAmount: amount,

        clearanceStatus: "PENDING",

        remarks:
            remarks || clearance.remarks
    });
};


const deleteFinancialClearance = async (id) => {

    const clearance =
        await repository.deleteById(id);

    if (!clearance) {
        throw new Error(
            "Financial clearance not found"
        );
    }

    return clearance;
};


module.exports = {

    createFinancialClearance,

    getFinancialClearances,

    getFinancialClearance,

    getPendingClearances,

    getClearancesByLifecycle,

    clearFinancialClearance,

    putOnHold,

    updateOutstandingAmount,

    deleteFinancialClearance
};