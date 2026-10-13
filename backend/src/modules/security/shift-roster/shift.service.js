const Society =
    require("../../societies/society/society.model");

const ShiftRepository =
    require("./shift.repository");

const {
    validateCreate,
    validateUpdate
} = require("./shift.validation");


const createShift = async (
    data
) => {

    validateCreate(data);

    const society =
        await Society.findByPk(
            data.societyId
        );

    if (!society) {
        throw new Error(
            "Society not found"
        );
    }

    const existing =
        await ShiftRepository.findByCode(
            data.societyId,
            data.shiftCode
        );

    if (existing) {
        throw new Error(
            "Shift code already exists in this society"
        );
    }

    return await ShiftRepository.create(
        data
    );
};


const getShiftById = async (
    id
) => {

    const shift =
        await ShiftRepository.findById(id);

    if (!shift) {
        throw new Error(
            "Shift not found"
        );
    }

    return shift;
};


const getAllShifts = async (
    filters = {}
) => {

    return await ShiftRepository.findAll(
        filters
    );
};


const updateShift = async (
    id,
    data
) => {

    validateUpdate(data);

    const shift =
        await ShiftRepository.findById(id);

    if (!shift) {
        throw new Error(
            "Shift not found"
        );
    }

    if (data.shiftCode) {

        const existing =
            await ShiftRepository.findByCode(
                shift.societyId,
                data.shiftCode
            );

        if (
            existing &&
            existing.id !== shift.id
        ) {
            throw new Error(
                "Shift code already exists"
            );
        }
    }

    return await ShiftRepository.update(
        shift,
        data
    );
};


const activateShift = async (
    id
) => {

    const shift =
        await ShiftRepository.findById(id);

    if (!shift) {
        throw new Error(
            "Shift not found"
        );
    }

    return await ShiftRepository.update(
        shift,
        {
            status: "ACTIVE"
        }
    );
};


const deactivateShift = async (
    id
) => {

    const shift =
        await ShiftRepository.findById(id);

    if (!shift) {
        throw new Error(
            "Shift not found"
        );
    }

    return await ShiftRepository.update(
        shift,
        {
            status: "INACTIVE"
        }
    );
};


const deleteShift = async (
    id
) => {

    const shift =
        await ShiftRepository.findById(id);

    if (!shift) {
        throw new Error(
            "Shift not found"
        );
    }

    await ShiftRepository.remove(
        shift
    );

    return {
        message:
            "Shift deleted successfully"
    };
};


module.exports = {
    createShift,
    getShiftById,
    getAllShifts,
    updateShift,
    activateShift,
    deactivateShift,
    deleteShift
};