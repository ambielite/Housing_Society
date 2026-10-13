const repository = require("./billingConfig.repository");

const createConfig = async (data) => {

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

    if (
        data.effectiveTo &&
        data.effectiveFrom > data.effectiveTo
    ) {
        throw new Error(
            "effectiveFrom cannot be greater than effectiveTo"
        );
    }

    if (
        data.configType === "BILLING_RULE" &&
        !data.billingModel
    ) {
        throw new Error(
            "billingModel is required for BILLING_RULE"
        );
    }

    if (
        data.billingModel === "FLAT_RATE" &&
        Number(data.flatAmount || 0) <= 0
    ) {
        throw new Error(
            "flatAmount must be greater than 0"
        );
    }

    if (
        data.billingModel === "AREA_BASED" &&
        Number(data.ratePerArea || 0) <= 0
    ) {
        throw new Error(
            "ratePerArea must be greater than 0"
        );
    }

    if (
        data.billingModel === "HYBRID" &&
        (
            Number(data.fixedAmount || 0) < 0 ||
            Number(data.ratePerArea || 0) <= 0
        )
    ) {
        throw new Error(
            "Hybrid billing requires valid fixedAmount and ratePerArea"
        );
    }

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