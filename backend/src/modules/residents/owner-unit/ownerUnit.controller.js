const ownerUnitService =
    require("./ownerUnit.service");


// CREATE
const createOwnerUnit = async (
    req,
    res
) => {

    try {

        const result =
            await ownerUnitService.createOwnerUnit(
                req.body
            );

        return res.status(201).json({
            success: true,
            message:
                "Owner-unit relationship created successfully",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// GET ALL
const getAllOwnerUnits = async (
    req,
    res
) => {

    try {

        const result =
            await ownerUnitService.getAllOwnerUnits(
                req.query
            );

        return res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// GET BY ID
const getOwnerUnitById = async (
    req,
    res
) => {

    try {

        const result =
            await ownerUnitService.getOwnerUnitById(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


// GET UNIT OWNERS
const getUnitOwners = async (
    req,
    res
) => {

    try {

        const result =
            await ownerUnitService.getUnitOwners(
                req.query.societyId,
                req.params.unitId
            );

        return res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// GET OWNER UNITS
const getOwnerUnits = async (
    req,
    res
) => {

    try {

        const result =
            await ownerUnitService.getOwnerUnits(
                req.query.societyId,
                req.params.ownerId
            );

        return res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// UPDATE
const updateOwnerUnit = async (
    req,
    res
) => {

    try {

        const result =
            await ownerUnitService.updateOwnerUnit(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message:
                "Owner-unit relationship updated successfully",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// DEACTIVATE
const deactivateOwnerUnit = async (
    req,
    res
) => {

    try {

        const result =
            await ownerUnitService.deactivateOwnerUnit(
                req.params.id,
                req.body.effectiveTo
            );

        return res.status(200).json({
            success: true,
            message:
                "Owner-unit relationship deactivated successfully",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// DELETE
const deleteOwnerUnit = async (
    req,
    res
) => {

    try {

        const result =
            await ownerUnitService.deleteOwnerUnit(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    createOwnerUnit,
    getAllOwnerUnits,
    getOwnerUnitById,
    getUnitOwners,
    getOwnerUnits,
    updateOwnerUnit,
    deactivateOwnerUnit,
    deleteOwnerUnit
};