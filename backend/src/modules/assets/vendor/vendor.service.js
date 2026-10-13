const Society = require("../../../modules/societies/society/society.model");
const Vendor = require("./vendor.model");

const vendorRepository =
    require("./vendor.repository");

const {
    validateCreateVendor,
    validateUpdateVendor
} = require("./vendor.validation");

const createVendor = async (data) => {

    const errors =
        validateCreateVendor(data);

    if (errors.length > 0) {
        throw new Error(
            errors.join(", ")
        );
    }

    const society =
        await Society.findByPk(
            data.societyId
        );

    if (!society) {
        throw new Error(
            "Society not found"
        );
    }

    const existingCode =
        await vendorRepository.findByVendorCode(
            data.societyId,
            data.vendorCode
        );

    if (existingCode) {
        throw new Error(
            "Vendor code already exists in this society"
        );
    }

    const existingName =
        await vendorRepository.findByCompanyName(
            data.societyId,
            data.companyName
        );

    if (existingName) {
        throw new Error(
            "Vendor company name already exists in this society"
        );
    }

    return await vendorRepository.create(
        data
    );
};


const getAllVendors = async (filters = {}) => {

    const where = {};

    if (filters.societyId) {
        where.societyId =
            filters.societyId;
    }

    if (filters.status) {
        where.status =
            filters.status;
    }

    if (filters.serviceType) {
        where.serviceType =
            filters.serviceType;
    }

    return await vendorRepository.findAll(
        where
    );
};


const getVendorById = async (id) => {

    const vendor =
        await vendorRepository.findById(id);

    if (!vendor) {
        throw new Error(
            "Vendor not found"
        );
    }

    return vendor;
};


const updateVendor = async (
    id,
    data
) => {

    const errors =
        validateUpdateVendor(data);

    if (errors.length > 0) {
        throw new Error(
            errors.join(", ")
        );
    }

    const vendor =
        await vendorRepository.findById(id);

    if (!vendor) {
        throw new Error(
            "Vendor not found"
        );
    }

    if (
        data.societyId &&
        data.societyId !== vendor.societyId
    ) {
        throw new Error(
            "Vendor society cannot be changed"
        );
    }

    if (
        data.vendorCode &&
        data.vendorCode !== vendor.vendorCode
    ) {

        const existingCode =
            await vendorRepository.findByVendorCode(
                vendor.societyId,
                data.vendorCode
            );

        if (existingCode) {
            throw new Error(
                "Vendor code already exists"
            );
        }
    }

    if (
        data.companyName &&
        data.companyName !== vendor.companyName
    ) {

        const existingName =
            await vendorRepository.findByCompanyName(
                vendor.societyId,
                data.companyName
            );

        if (existingName) {
            throw new Error(
                "Vendor company name already exists"
            );
        }
    }

    return await vendorRepository.update(
        vendor,
        data
    );
};


const activateVendor = async (id) => {

    const vendor =
        await vendorRepository.findById(id);

    if (!vendor) {
        throw new Error(
            "Vendor not found"
        );
    }

    if (vendor.status === "BLACKLISTED") {
        throw new Error(
            "Blacklisted vendor cannot be activated"
        );
    }

    return await vendorRepository.update(
        vendor,
        {
            status: "ACTIVE"
        }
    );
};


const deactivateVendor = async (id) => {

    const vendor =
        await vendorRepository.findById(id);

    if (!vendor) {
        throw new Error(
            "Vendor not found"
        );
    }

    return await vendorRepository.update(
        vendor,
        {
            status: "INACTIVE"
        }
    );
};


const blacklistVendor = async (id) => {

    const vendor =
        await vendorRepository.findById(id);

    if (!vendor) {
        throw new Error(
            "Vendor not found"
        );
    }

    return await vendorRepository.update(
        vendor,
        {
            status: "BLACKLISTED"
        }
    );
};


const deleteVendor = async (id) => {

    const vendor =
        await vendorRepository.findById(id);

    if (!vendor) {
        throw new Error(
            "Vendor not found"
        );
    }

    const AMC =
        require("../amc/amc.model");

    const amcCount =
        await AMC.count({
            where: {
                vendorId: id
            }
        });

    if (amcCount > 0) {
        throw new Error(
            "Vendor cannot be deleted because AMC records exist"
        );
    }

    return await vendorRepository.deleteVendor(
        vendor
    );
};


module.exports = {
    createVendor,
    getAllVendors,
    getVendorById,
    updateVendor,
    activateVendor,
    deactivateVendor,
    blacklistVendor,
    deleteVendor
};