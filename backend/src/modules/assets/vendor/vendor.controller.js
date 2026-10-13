const vendorService =
    require("./vendor.service");


const createVendor = async (
    req,
    res
) => {

    try {

        const vendor =
            await vendorService.createVendor(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Vendor created successfully",
            data: vendor
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const getAllVendors = async (
    req,
    res
) => {

    try {

        const vendors =
            await vendorService.getAllVendors(
                req.query
            );

        res.status(200).json({
            success: true,
            count: vendors.length,
            data: vendors
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const getVendorById = async (
    req,
    res
) => {

    try {

        const vendor =
            await vendorService.getVendorById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: vendor
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });

    }
};


const updateVendor = async (
    req,
    res
) => {

    try {

        const vendor =
            await vendorService.updateVendor(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message:
                "Vendor updated successfully",
            data: vendor
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const activateVendor = async (
    req,
    res
) => {

    try {

        const vendor =
            await vendorService.activateVendor(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Vendor activated successfully",
            data: vendor
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const deactivateVendor = async (
    req,
    res
) => {

    try {

        const vendor =
            await vendorService.deactivateVendor(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Vendor deactivated successfully",
            data: vendor
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const blacklistVendor = async (
    req,
    res
) => {

    try {

        const vendor =
            await vendorService.blacklistVendor(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Vendor blacklisted successfully",
            data: vendor
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const deleteVendor = async (
    req,
    res
) => {

    try {

        await vendorService.deleteVendor(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message:
                "Vendor deleted successfully"
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
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