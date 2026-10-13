const validateSociety = (
    societyId
) => {

    if (!societyId) {
        throw new Error(
            "societyId is required"
        );
    }
};


const validateRate = (
    taxRate
) => {

    if (
        taxRate === undefined ||
        taxRate === null ||
        isNaN(taxRate)
    ) {
        throw new Error(
            "taxRate is required"
        );
    }

    if (
        Number(taxRate) < 0 ||
        Number(taxRate) > 100
    ) {
        throw new Error(
            "taxRate must be between 0 and 100"
        );
    }
};


const validateTaxType = (
    taxType
) => {

    const allowed = [
        "GST",
        "CGST",
        "SGST",
        "IGST",
        "TDS",
        "OTHER"
    ];

    if (!allowed.includes(taxType)) {
        throw new Error(
            "Invalid taxType"
        );
    }
};


module.exports = {
    validateSociety,
    validateRate,
    validateTaxType
};