const repository = require("./gatePass.repository");

const generatePassCode = () => String(Math.floor(100000 + Math.random() * 900000));


const createGatePass = async (data) => {

    if (
        data.validUntil &&
        new Date(data.validUntil) <=
        new Date(data.validFrom)
    ) {
        throw new Error(
            "validUntil must be after validFrom"
        );
    }

    const passCode = generatePassCode();

    return await repository.create({
        societyId: data.societyId,
        unitId: data.unitId,
        residentId: data.residentId,

        lifecycleType: data.lifecycleType,
        lifecycleId: data.lifecycleId,

        passType: data.passType,

        passCode,

        validFrom:
            data.validFrom || new Date(),

        validUntil:
            data.validUntil,

        status: "ACTIVE",

        remarks:
            data.remarks || null
    });
};


const getGatePasses = async () => {
    return await repository.findAll();
};


const getGatePass = async (id) => {
    return await repository.findById(id);
};


const getActiveGatePasses = async () => {
    return await repository.findActive();
};


const getGatePassByCode = async (passCode) => {
    return await repository.findByPassCode(
        passCode
    );
};


const getGatePassesByLifecycle = async (
    lifecycleType,
    lifecycleId
) => {
    return await repository.findByLifecycle(
        lifecycleType,
        lifecycleId
    );
};


const verifyGatePass = async (
    id,
    verifiedBy
) => {
    const gatePass =
        await repository.findById(id);

    if (!gatePass) {
        throw new Error(
            "Gate pass not found"
        );
    }

    const now = new Date();

    if (
        gatePass.status !== "ACTIVE"
    ) {
        throw new Error(
            `Gate pass is ${gatePass.status.toLowerCase()}`
        );
    }

    if (
        now < new Date(gatePass.validFrom)
    ) {
        throw new Error(
            "Gate pass is not valid yet"
        );
    }

    if (
        now > new Date(gatePass.validUntil)
    ) {
        await repository.update(id, {
            status: "EXPIRED"
        });

        throw new Error(
            "Gate pass has expired"
        );
    }

    return await repository.update(id, {
        verifiedBy,
        verifiedAt: now
    });
};


const useGatePass = async (id) => {

    const gatePass =
        await repository.findById(id);

    if (!gatePass) {
        throw new Error(
            "Gate pass not found"
        );
    }

    if (
        gatePass.status !== "ACTIVE"
    ) {
        throw new Error(
            `Gate pass cannot be used because it is ${gatePass.status.toLowerCase()}`
        );
    }

    const now = new Date();

    if (
        now < new Date(gatePass.validFrom)
    ) {
        throw new Error(
            "Gate pass is not valid yet"
        );
    }

    if (
        now > new Date(gatePass.validUntil)
    ) {
        await repository.update(id, {
            status: "EXPIRED"
        });

        throw new Error(
            "Gate pass has expired"
        );
    }

    return await repository.update(id, {
        status: "USED",
        usedAt: now
    });
};


const cancelGatePass = async (
    id,
    remarks
) => {

    const gatePass =
        await repository.findById(id);

    if (!gatePass) {
        throw new Error(
            "Gate pass not found"
        );
    }

    if (
        gatePass.status !== "ACTIVE"
    ) {
        throw new Error(
            "Only active gate passes can be cancelled"
        );
    }

    return await repository.update(id, {
        status: "CANCELLED",
        remarks:
            remarks ||
            "Gate pass cancelled"
    });
};


const deleteGatePass = async (id) => {

    const gatePass =
        await repository.deleteById(id);

    if (!gatePass) {
        throw new Error(
            "Gate pass not found"
        );
    }

    return gatePass;
};


module.exports = {
    createGatePass,
    getGatePasses,
    getGatePass,
    getActiveGatePasses,
    getGatePassByCode,
    getGatePassesByLifecycle,
    verifyGatePass,
    useGatePass,
    cancelGatePass,
    deleteGatePass
};
