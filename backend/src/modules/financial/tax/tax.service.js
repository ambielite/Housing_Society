const TaxRepository =
    require("./tax.repository");

const {
    validateSociety,
    validateRate,
    validateTaxType
} = require("./tax.validation");


/*
|--------------------------------------------------------------------------
| Create Tax Configuration
|--------------------------------------------------------------------------
*/

const createTax = async (
    data
) => {

    validateSociety(
        data.societyId
    );

    validateRate(
        data.taxRate
    );

    validateTaxType(
        data.taxType
    );


    if (!data.taxCode) {

        throw new Error(
            "taxCode is required"
        );
    }


    if (!data.taxName) {

        throw new Error(
            "taxName is required"
        );
    }


    if (!data.effectiveFrom) {

        throw new Error(
            "effectiveFrom is required"
        );
    }


    const existing =
        await TaxRepository.findByCode(
            data.societyId,
            data.taxCode
        );


    if (existing) {

        throw new Error(
            "Tax code already exists for this society"
        );
    }


    return await TaxRepository.create({

        societyId:
            data.societyId,

        taxCode:
            data.taxCode,

        taxName:
            data.taxName,

        taxType:
            data.taxType,

        taxRate:
            data.taxRate,

        calculationMethod:
            data.calculationMethod ||
            "PERCENTAGE",

        fixedAmount:
            data.fixedAmount ||
            null,

        componentGroup:
            data.componentGroup ||
            null,

        applicableOn:
            data.applicableOn ||
            "INVOICE",

        registrationNumber:
            data.registrationNumber ||
            null,

        effectiveFrom:
            data.effectiveFrom,

        effectiveTo:
            data.effectiveTo ||
            null,

        isActive:
            data.isActive !== undefined
                ? data.isActive
                : true,

        description:
            data.description ||
            null,

        remarks:
            data.remarks ||
            null,

        metadata:
            data.metadata ||
            null
    });
};


/*
|--------------------------------------------------------------------------
| Calculate Single Tax
|--------------------------------------------------------------------------
*/

const calculateTax = async (
    baseAmount,
    taxRate,
    calculationMethod = "PERCENTAGE",
    fixedAmount = null
) => {

    if (
        baseAmount === undefined ||
        baseAmount === null ||
        isNaN(baseAmount)
    ) {

        throw new Error(
            "Valid baseAmount is required"
        );
    }


    if (
        Number(baseAmount) < 0
    ) {

        throw new Error(
            "baseAmount cannot be negative"
        );
    }


    if (
        calculationMethod ===
        "FIXED"
    ) {

        return Number(
            fixedAmount || 0
        );
    }


    return (
        Number(baseAmount) *
        Number(taxRate) /
        100
    );
};


/*
|--------------------------------------------------------------------------
| Calculate GST
|--------------------------------------------------------------------------
*/

const calculateGST = async (
    baseAmount,
    gstRate,
    gstType = "CGST_SGST"
) => {

    const amount =
        Number(baseAmount);

    const rate =
        Number(gstRate);


    if (amount < 0) {

        throw new Error(
            "Base amount cannot be negative"
        );
    }


    if (rate < 0) {

        throw new Error(
            "GST rate cannot be negative"
        );
    }


    /*
    Example:

    Base = 10000
    GST = 18%

    CGST = 9%
    SGST = 9%
    */


    if (
        gstType ===
        "CGST_SGST"
    ) {

        const totalGST =
            amount * rate / 100;

        const half =
            totalGST / 2;

        return {

            baseAmount:
                amount,

            gstRate:
                rate,

            cgstRate:
                rate / 2,

            sgstRate:
                rate / 2,

            cgstAmount:
                half,

            sgstAmount:
                half,

            totalTax:
                totalGST,

            totalAmount:
                amount + totalGST
        };
    }


    /*
    IGST
    */

    if (
        gstType ===
        "IGST"
    ) {

        const igst =
            amount * rate / 100;

        return {

            baseAmount:
                amount,

            gstRate:
                rate,

            igstRate:
                rate,

            igstAmount:
                igst,

            totalTax:
                igst,

            totalAmount:
                amount + igst
        };
    }


    throw new Error(
        "Invalid GST type"
    );
};


/*
|--------------------------------------------------------------------------
| Calculate TDS
|--------------------------------------------------------------------------
*/

const calculateTDS = async (
    baseAmount,
    tdsRate
) => {

    const amount =
        Number(baseAmount);

    const rate =
        Number(tdsRate);


    if (amount < 0) {

        throw new Error(
            "Base amount cannot be negative"
        );
    }


    if (rate < 0) {

        throw new Error(
            "TDS rate cannot be negative"
        );
    }


    const tdsAmount =
        amount * rate / 100;


    return {

        baseAmount:
            amount,

        tdsRate:
            rate,

        tdsAmount,

        netAmount:
            amount - tdsAmount
    };
};


/*
|--------------------------------------------------------------------------
| Calculate Invoice Tax
|--------------------------------------------------------------------------
*/

const calculateInvoiceTax = async (
    societyId,
    baseAmount,
    date,
    taxType
) => {

    validateSociety(
        societyId
    );


    const taxes =
        await TaxRepository
            .findEffectiveTaxes(
                societyId,
                date
            );


    let applicableTaxes =
        taxes;


    if (taxType) {

        applicableTaxes =
            taxes.filter(
                tax =>
                    tax.taxType ===
                    taxType
            );
    }


    let totalTax = 0;

    const components = [];


    for (
        const tax of applicableTaxes
    ) {

        if (
            tax.applicableOn !==
            "INVOICE"
        ) {
            continue;
        }


        const taxAmount =
            await calculateTax(
                baseAmount,
                tax.taxRate,
                tax.calculationMethod,
                tax.fixedAmount
            );


        totalTax +=
            Number(taxAmount);


        components.push({

            taxId:
                tax.id,

            taxCode:
                tax.taxCode,

            taxName:
                tax.taxName,

            taxType:
                tax.taxType,

            taxRate:
                Number(tax.taxRate),

            taxableAmount:
                Number(baseAmount),

            taxAmount:
                Number(taxAmount)
        });
    }


    return {

        baseAmount:
            Number(baseAmount),

        totalTax,

        totalAmount:
            Number(baseAmount) +
            totalTax,

        components
    };
};


/*
|--------------------------------------------------------------------------
| Get Tax
|--------------------------------------------------------------------------
*/

const getById = async (
    id
) => {

    const tax =
        await TaxRepository.findById(
            id
        );


    if (!tax) {

        throw new Error(
            "Tax configuration not found"
        );
    }


    return tax;
};


/*
|--------------------------------------------------------------------------
| Get All Taxes
|--------------------------------------------------------------------------
*/

const getAll = async (
    filters
) => {

    return await TaxRepository.findAll(
        filters
    );
};


/*
|--------------------------------------------------------------------------
| Update Tax
|--------------------------------------------------------------------------
*/

const updateTax = async (
    id,
    data
) => {

    const tax =
        await TaxRepository.findById(
            id
        );


    if (!tax) {

        throw new Error(
            "Tax configuration not found"
        );
    }


    if (
        data.taxRate !== undefined
    ) {

        validateRate(
            data.taxRate
        );
    }


    if (
        data.taxType !== undefined
    ) {

        validateTaxType(
            data.taxType
        );
    }


    await TaxRepository.update(
        tax,
        data
    );


    return tax;
};


/*
|--------------------------------------------------------------------------
| Deactivate Tax
|--------------------------------------------------------------------------
*/

const deactivateTax = async (
    id
) => {

    const tax =
        await TaxRepository.findById(
            id
        );


    if (!tax) {

        throw new Error(
            "Tax configuration not found"
        );
    }


    await TaxRepository.update(
        tax,
        {
            isActive: false
        }
    );


    return tax;
};


module.exports = {
    createTax,
    calculateTax,
    calculateGST,
    calculateTDS,
    calculateInvoiceTax,
    getById,
    getAll,
    updateTax,
    deactivateTax
};