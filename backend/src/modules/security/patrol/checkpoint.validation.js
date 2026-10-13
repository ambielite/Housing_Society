const allowedVerificationMethods = [
    "QR",
    "NFC",
    "GPS",
    "QR_NFC",
    "QR_GPS",
    "NFC_GPS",
    "QR_NFC_GPS"
];

const allowedStatuses = [
    "ACTIVE",
    "INACTIVE"
];


const validateCreate = (data) => {

    const requiredFields = [
        "societyId",
        "checkpointCode",
        "checkpointName",
        "locationName"
    ];

    for (const field of requiredFields) {

        if (
            data[field] === undefined ||
            data[field] === null ||
            data[field] === ""
        ) {
            throw new Error(`${field} is required`);
        }
    }


    if (
        data.verificationMethod &&
        !allowedVerificationMethods.includes(
            data.verificationMethod
        )
    ) {
        throw new Error(
            "Invalid verificationMethod"
        );
    }


    if (
        data.status &&
        !allowedStatuses.includes(data.status)
    ) {
        throw new Error(
            "Invalid checkpoint status"
        );
    }


    if (
        data.gpsRadiusMeters !== undefined &&
        data.gpsRadiusMeters !== null &&
        data.gpsRadiusMeters < 0
    ) {
        throw new Error(
            "gpsRadiusMeters cannot be negative"
        );
    }


    if (
        data.sequenceOrder !== undefined &&
        data.sequenceOrder < 1
    ) {
        throw new Error(
            "sequenceOrder must be greater than 0"
        );
    }


    return true;
};


const validateUpdate = (data) => {

    if (
        data.verificationMethod &&
        !allowedVerificationMethods.includes(
            data.verificationMethod
        )
    ) {
        throw new Error(
            "Invalid verificationMethod"
        );
    }


    if (
        data.status &&
        !allowedStatuses.includes(data.status)
    ) {
        throw new Error(
            "Invalid checkpoint status"
        );
    }


    if (
        data.gpsRadiusMeters !== undefined &&
        data.gpsRadiusMeters !== null &&
        data.gpsRadiusMeters < 0
    ) {
        throw new Error(
            "gpsRadiusMeters cannot be negative"
        );
    }


    return true;
};


module.exports = {
    allowedVerificationMethods,
    allowedStatuses,
    validateCreate,
    validateUpdate
};