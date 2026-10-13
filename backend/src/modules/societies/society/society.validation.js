const validateSocietyCreate = (req, res, next) => {
    const {
        name,
        reraNumber,
        pan,
        gstin,
        address,
        structuralArea,
        currency,
        timezone,
        taxConfiguration
    } = req.body;

    if (!name || name.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Society registered name is required"
        });
    }

    if (name.length > 255) {
        return res.status(400).json({
            success: false,
            message: "Society name cannot exceed 255 characters"
        });
    }

    if (reraNumber && reraNumber.length > 100) {
        return res.status(400).json({
            success: false,
            message: "RERA number cannot exceed 100 characters"
        });
    }

    if (pan && pan.length > 20) {
        return res.status(400).json({
            success: false,
            message: "PAN cannot exceed 20 characters"
        });
    }

    if (gstin && gstin.length > 20) {
        return res.status(400).json({
            success: false,
            message: "GSTIN cannot exceed 20 characters"
        });
    }

    if (!address || address.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Society address is required"
        });
    }

    if (
        structuralArea !== undefined &&
        structuralArea !== null &&
        Number(structuralArea) < 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Structural area cannot be negative"
        });
    }

    if (!currency || currency.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Currency is required"
        });
    }

    if (!timezone || timezone.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Timezone is required"
        });
    }

    if (
        taxConfiguration !== undefined &&
        typeof taxConfiguration !== "object"
    ) {
        return res.status(400).json({
            success: false,
            message: "Tax configuration must be an object"
        });
    }

    next();
};


const validateSocietyUpdate = (req, res, next) => {
    const {
        name,
        structuralArea,
        currency,
        timezone,
        taxConfiguration
    } = req.body;

    if (
        name !== undefined &&
        (!name || name.trim() === "")
    ) {
        return res.status(400).json({
            success: false,
            message: "Society name cannot be empty"
        });
    }

    if (
        structuralArea !== undefined &&
        Number(structuralArea) < 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Structural area cannot be negative"
        });
    }

    if (
        currency !== undefined &&
        (!currency || currency.trim() === "")
    ) {
        return res.status(400).json({
            success: false,
            message: "Currency cannot be empty"
        });
    }

    if (
        timezone !== undefined &&
        (!timezone || timezone.trim() === "")
    ) {
        return res.status(400).json({
            success: false,
            message: "Timezone cannot be empty"
        });
    }

    if (
        taxConfiguration !== undefined &&
        typeof taxConfiguration !== "object"
    ) {
        return res.status(400).json({
            success: false,
            message: "Tax configuration must be an object"
        });
    }

    next();
};


const validateSocietyId = (req, res, next) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            success: false,
            message: "Society ID is required"
        });
    }

    next();
};


module.exports = {
    validateSocietyCreate,
    validateSocietyUpdate,
    validateSocietyId
};