
const AssetMaintenance =
    require("./assetMaintenance.model");

const maintenanceRepository =
    require("./assetMaintenance.repository");

const Asset =
    require("../asset/asset.model");

const {
    validateCreateMaintenance,
    validateUpdateMaintenance
} = require("./assetMaintenance.validation");

const createMaintenance = async (data) => {

    const errors =
        validateCreateMaintenance(data);

    if (errors.length > 0) {
        throw new Error(errors.join(", "));
    }

    const asset =
        await Asset.findByPk(data.assetId);

    if (!asset) {
        throw new Error("Asset not found");
    }

    if (
        asset.status === "RETIRED" ||
        asset.status === "DISPOSED"
    ) {
        throw new Error(
            "Maintenance cannot be created for retired or disposed asset"
        );
    }

    if (
        data.completionDate &&
        new Date(data.completionDate) <
            new Date(data.serviceDate)
    ) {
        throw new Error(
            "completionDate cannot be before serviceDate"
        );
    }

    if (
        data.nextServiceDate &&
        new Date(data.nextServiceDate) <
            new Date(data.serviceDate)
    ) {
        throw new Error(
            "nextServiceDate cannot be before serviceDate"
        );
    }

    return await maintenanceRepository.create(data);
};

const getAllMaintenance = async (filters = {}) => {

    const where = {};

    if (filters.assetId) {
        where.assetId = filters.assetId;
    }

    if (filters.maintenanceType) {
        where.maintenanceType =
            filters.maintenanceType;
    }

    if (filters.maintenanceStatus) {
        where.maintenanceStatus =
            filters.maintenanceStatus;
    }

    if (filters.vendorId) {
        where.vendorId = filters.vendorId;
    }

    return await maintenanceRepository.findAll(
        where
    );
};

const getMaintenanceById = async (id) => {

    const maintenance =
        await maintenanceRepository.findById(id);

    if (!maintenance) {
        throw new Error(
            "Maintenance record not found"
        );
    }

    return maintenance;
};

const getMaintenanceByAssetId = async (assetId) => {

    const asset =
        await Asset.findByPk(assetId);

    if (!asset) {
        throw new Error("Asset not found");
    }

    return await maintenanceRepository.findByAssetId(
        assetId
    );
};

const updateMaintenance = async (id, data) => {

    const maintenance =
        await maintenanceRepository.findById(id);

    if (!maintenance) {
        throw new Error(
            "Maintenance record not found"
        );
    }

    const errors =
        validateUpdateMaintenance(data);

    if (errors.length > 0) {
        throw new Error(errors.join(", "));
    }

    if (data.assetId) {
        throw new Error(
            "assetId cannot be changed"
        );
    }

    if (
        maintenance.maintenanceStatus ===
        "COMPLETED"
    ) {
        throw new Error(
            "Completed maintenance record cannot be updated"
        );
    }

    if (
        maintenance.maintenanceStatus ===
        "CANCELLED"
    ) {
        throw new Error(
            "Cancelled maintenance record cannot be updated"
        );
    }

    const serviceDate =
        data.serviceDate ||
        maintenance.serviceDate;

    const completionDate =
        data.completionDate ||
        maintenance.completionDate;

    const nextServiceDate =
        data.nextServiceDate ||
        maintenance.nextServiceDate;

    if (
        completionDate &&
        new Date(completionDate) <
            new Date(serviceDate)
    ) {
        throw new Error(
            "completionDate cannot be before serviceDate"
        );
    }

    if (
        nextServiceDate &&
        new Date(nextServiceDate) <
            new Date(serviceDate)
    ) {
        throw new Error(
            "nextServiceDate cannot be before serviceDate"
        );
    }

    return await maintenanceRepository.update(
        maintenance,
        data
    );
};

const startMaintenance = async (id) => {

    const maintenance =
        await maintenanceRepository.findById(id);

    if (!maintenance) {
        throw new Error(
            "Maintenance record not found"
        );
    }

    if (
        maintenance.maintenanceStatus ===
        "COMPLETED"
    ) {
        throw new Error(
            "Maintenance is already completed"
        );
    }

    if (
        maintenance.maintenanceStatus ===
        "CANCELLED"
    ) {
        throw new Error(
            "Cancelled maintenance cannot be started"
        );
    }

    if (
        maintenance.maintenanceStatus ===
        "IN_PROGRESS"
    ) {
        throw new Error(
            "Maintenance is already in progress"
        );
    }

    const asset =
        await Asset.findByPk(
            maintenance.assetId
        );

    if (!asset) {
        throw new Error("Asset not found");
    }

    if (
        asset.status === "RETIRED" ||
        asset.status === "DISPOSED"
    ) {
        throw new Error(
            "Retired or disposed asset cannot be maintained"
        );
    }

    await asset.update({
        status: "UNDER_MAINTENANCE"
    });

    return await maintenanceRepository.update(
        maintenance,
        {
            maintenanceStatus: "IN_PROGRESS"
        }
    );
};

const completeMaintenance = async (id, data = {}) => {

    const maintenance =
        await maintenanceRepository.findById(id);

    if (!maintenance) {
        throw new Error(
            "Maintenance record not found"
        );
    }

    if (
        maintenance.maintenanceStatus ===
        "COMPLETED"
    ) {
        throw new Error(
            "Maintenance is already completed"
        );
    }

    if (
        maintenance.maintenanceStatus ===
        "CANCELLED"
    ) {
        throw new Error(
            "Cancelled maintenance cannot be completed"
        );
    }

    const asset =
        await Asset.findByPk(
            maintenance.assetId
        );

    if (!asset) {
        throw new Error("Asset not found");
    }

    const completionDate =
        data.completionDate ||
        new Date().toISOString().split("T")[0];

    if (
        new Date(completionDate) <
        new Date(maintenance.serviceDate)
    ) {
        throw new Error(
            "completionDate cannot be before serviceDate"
        );
    }

    const updateData = {
        maintenanceStatus: "COMPLETED",
        completionDate
    };

    if (data.workPerformed !== undefined) {
        updateData.workPerformed =
            data.workPerformed;
    }

    if (data.maintenanceCost !== undefined) {
        updateData.maintenanceCost =
            data.maintenanceCost;
    }

    if (data.partsCost !== undefined) {
        updateData.partsCost =
            data.partsCost;
    }

    if (data.laborCost !== undefined) {
        updateData.laborCost =
            data.laborCost;
    }

    if (data.invoiceNumber !== undefined) {
        updateData.invoiceNumber =
            data.invoiceNumber;
    }

    if (data.nextServiceDate !== undefined) {
        updateData.nextServiceDate =
            data.nextServiceDate;
    }

    if (data.remarks !== undefined) {
        updateData.remarks =
            data.remarks;
    }

    const updatedMaintenance =
        await maintenanceRepository.update(
            maintenance,
            updateData
        );

    if (asset.status === "UNDER_MAINTENANCE") {
        await asset.update({
            status: "ACTIVE"
        });
    }

    return updatedMaintenance;
};

const cancelMaintenance = async (id) => {

    const maintenance =
        await maintenanceRepository.findById(id);

    if (!maintenance) {
        throw new Error(
            "Maintenance record not found"
        );
    }

    if (
        maintenance.maintenanceStatus ===
        "COMPLETED"
    ) {
        throw new Error(
            "Completed maintenance cannot be cancelled"
        );
    }

    if (
        maintenance.maintenanceStatus ===
        "CANCELLED"
    ) {
        throw new Error(
            "Maintenance is already cancelled"
        );
    }

    const asset =
        await Asset.findByPk(
            maintenance.assetId
        );

    if (!asset) {
        throw new Error("Asset not found");
    }

    const updatedMaintenance =
        await maintenanceRepository.update(
            maintenance,
            {
                maintenanceStatus: "CANCELLED"
            }
        );

    if (asset.status === "UNDER_MAINTENANCE") {
        await asset.update({
            status: "ACTIVE"
        });
    }

    return updatedMaintenance;
};

const deleteMaintenance = async (id) => {

    const maintenance =
        await maintenanceRepository.findById(id);

    if (!maintenance) {
        throw new Error(
            "Maintenance record not found"
        );
    }

    if (
        maintenance.maintenanceStatus ===
        "IN_PROGRESS"
    ) {
        throw new Error(
            "In-progress maintenance cannot be deleted"
        );
    }

    await maintenanceRepository.deleteMaintenance(
        maintenance
    );

    return {
        message:
            "Maintenance record deleted successfully"
    };
};

module.exports = {
    createMaintenance,
    getAllMaintenance,
    getMaintenanceById,
    getMaintenanceByAssetId,
    updateMaintenance,
    startMaintenance,
    completeMaintenance,
    cancelMaintenance,
    deleteMaintenance
};

