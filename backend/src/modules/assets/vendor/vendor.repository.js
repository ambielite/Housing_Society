const Vendor = require("./vendor.model");

const create = async (data) => {
    return await Vendor.create(data);
};

const findAll = async (where = {}) => {
    return await Vendor.findAll({
        where,
        order: [
            ["companyName", "ASC"]
        ]
    });
};

const findById = async (id) => {
    return await Vendor.findByPk(id);
};

const findByVendorCode = async (
    societyId,
    vendorCode
) => {
    return await Vendor.findOne({
        where: {
            societyId,
            vendorCode
        }
    });
};

const findByCompanyName = async (
    societyId,
    companyName
) => {
    return await Vendor.findOne({
        where: {
            societyId,
            companyName
        }
    });
};

const update = async (
    vendor,
    data
) => {
    return await vendor.update(data);
};

const deleteVendor = async (
    vendor
) => {
    return await vendor.destroy();
};

module.exports = {
    create,
    findAll,
    findById,
    findByVendorCode,
    findByCompanyName,
    update,
    deleteVendor
};