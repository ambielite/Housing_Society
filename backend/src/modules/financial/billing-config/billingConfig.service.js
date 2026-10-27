const repository = require("./billingConfig.repository");

const NUMERIC_FIELDS = [
    "flatAmount",
    "ratePerArea",
    "fixedAmount",
    "billingDay",
    "dueDays",
    "penaltyValue",
    "gracePeriodDays",
    "taxRate"
];

const normalizeNumericFields = (data) => {
    const normalized = { ...data };

    for (const field of NUMERIC_FIELDS) {
        if (!Object.prototype.hasOwnProperty.call(normalized, field)) continue;
        const value = normalized[field];
        if (value == null || value === "") {
            normalized[field] = null;
            continue;
        }

        const number = Number(value);
        if (!Number.isFinite(number)) {
            throw new Error(`${field} must be a valid number`);
        }
        normalized[field] = number;
    }

    return normalized;
};

const validateConfig = (data) => {
    if (
        data.effectiveTo &&
        data.effectiveFrom &&
        data.effectiveFrom > data.effectiveTo
    ) {
        throw new Error("effectiveFrom cannot be greater than effectiveTo");
    }

    if (data.configType === "BILLING_RULE") {
        if (!data.billingModel) {
            throw new Error("billingModel is required for BILLING_RULE");
        }

        if (data.billingModel === "FLAT_RATE" && Number(data.flatAmount || 0) <= 0) {
            throw new Error("flatAmount must be greater than 0");
        }

        if (data.billingModel === "AREA_BASED" && Number(data.ratePerArea || 0) <= 0) {
            throw new Error("ratePerArea must be greater than 0");
        }

        if (
            data.billingModel === "HYBRID" &&
            (Number(data.fixedAmount || 0) < 0 || Number(data.ratePerArea || 0) <= 0)
        ) {
            throw new Error("Hybrid billing requires valid fixedAmount and ratePerArea");
        }
    }

    if (data.configType === "BILLING_CYCLE") {
        if (!data.billingFrequency) {
            throw new Error("billingFrequency is required for BILLING_CYCLE");
        }

        const billingDay = Number(data.billingDay);
        if (!Number.isInteger(billingDay) || billingDay < 1 || billingDay > 28) {
            throw new Error("billingDay must be between 1 and 28");
        }

        if (Number(data.dueDays || 0) < 0) {
            throw new Error("dueDays cannot be negative");
        }
    }

    if (data.configType === "PENALTY_RULE") {
        if (!data.penaltyType) {
            throw new Error("penaltyType is required for PENALTY_RULE");
        }

        if (data.penaltyValue == null || Number(data.penaltyValue) < 0) {
            throw new Error("penaltyValue must be zero or greater for PENALTY_RULE");
        }

        if (Number(data.gracePeriodDays || 0) < 0) {
            throw new Error("gracePeriodDays cannot be negative");
        }
    }
};

const createConfig = async (data) => {
    data = normalizeNumericFields(data);

    const existing = await repository.findByCode(
        data.societyId,
        data.configType,
        data.code
    );

    if (existing) {
        throw new Error(
            "Billing configuration with this code already exists"
        );
    }

    validateConfig(data);

    return repository.create(data);
};

const getAllConfigs = async (societyId, configType) => {

    const where = {
        societyId
    };

    if (configType) {
        where.configType = configType;
    }

    return repository.findAll(where);
};

const getConfigById = async (id) => {

    const config = await repository.findById(id);

    if (!config) {
        throw new Error(
            "Billing configuration not found"
        );
    }

    return config;
};

const updateConfig = async (id, data) => {
    data = normalizeNumericFields(data);

    const existing = await repository.findById(id);
    if (!existing) {
        throw new Error("Billing configuration not found");
    }

    validateConfig({ ...existing.toJSON(), ...data });

    const config = await repository.update(
        id,
        data
    );

    if (!config) {
        throw new Error(
            "Billing configuration not found"
        );
    }

    return config;
};

const deleteConfig = async (id) => {

    const config = await repository.findById(id);

    if (!config) {
        throw new Error(
            "Billing configuration not found"
        );
    }

    await repository.update(id, {
        isActive: false
    });

    return {
        message: "Billing configuration deactivated successfully"
    };
};

module.exports = {
    createConfig,
    getAllConfigs,
    getConfigById,
    updateConfig,
    deleteConfig
};
