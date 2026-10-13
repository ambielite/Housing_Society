const validateCreateDocument = (data) => {

    const requiredFields = [
        "staffId",
        "documentType",
        "documentPath"
    ];

    for (const field of requiredFields) {

        if (
            data[field] === undefined ||
            data[field] === null ||
            data[field] === ""
        ) {
            return `${field} is required`;
        }
    }

    return null;
};


const validateDocumentType = (documentType) => {

    const allowedTypes = [
        "ID_PROOF",
        "PAN",
        "ADDRESS_PROOF",
        "POLICE_VERIFICATION",
        "EMPLOYMENT_PROOF",
        "CONTRACT",
        "MEDICAL_CERTIFICATE",
        "OTHER"
    ];

    if (!allowedTypes.includes(documentType)) {
        return "Invalid documentType";
    }

    return null;
};


module.exports = {
    validateCreateDocument,
    validateDocumentType
};