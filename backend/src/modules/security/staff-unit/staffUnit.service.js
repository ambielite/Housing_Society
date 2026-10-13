const Staff =
    require("../staff/staff.model");

const Unit =
    require("../../societies/unit/unit.model");

const StaffUnitRepository =
    require("./staffUnit.repository");

const {
    validateCreate,
    validateUpdate
} = require("./staffUnit.validation");


const createAssignment = async (data) => {

    validateCreate(data);

    // Check staff
    const staff =
        await Staff.findByPk(data.staffId);

    if (!staff) {
        throw new Error(
            "Staff not found"
        );
    }

    // Check unit
    const unit =
        await Unit.findByPk(data.unitId);

    if (!unit) {
        throw new Error(
            "Unit not found"
        );
    }

    // Staff should be active
    if (staff.status !== "ACTIVE") {

        throw new Error(
            "Only active staff can be assigned"
        );
    }

    // Check duplicate active assignment
    const existing =
        await StaffUnitRepository
            .findActiveByStaffAndUnit(
                data.staffId,
                data.unitId
            );

    if (existing) {

        throw new Error(
            "Staff is already actively assigned to this unit"
        );
    }

    return await StaffUnitRepository.create(
        data
    );
};


const getAssignmentById = async (id) => {

    const assignment =
        await StaffUnitRepository.findById(id);

    if (!assignment) {
        throw new Error(
            "Staff-unit assignment not found"
        );
    }

    return assignment;
};


const getAssignmentsByStaff = async (
    staffId
) => {

    const staff =
        await Staff.findByPk(staffId);

    if (!staff) {
        throw new Error(
            "Staff not found"
        );
    }

    return await StaffUnitRepository
        .findByStaffId(staffId);
};


const getAssignmentsByUnit = async (
    unitId
) => {

    const unit =
        await Unit.findByPk(unitId);

    if (!unit) {
        throw new Error(
            "Unit not found"
        );
    }

    return await StaffUnitRepository
        .findByUnitId(unitId);
};


const getAllAssignments = async (
    filters = {}
) => {

    return await StaffUnitRepository
        .findAll(filters);
};


const updateAssignment = async (
    id,
    data
) => {

    validateUpdate(data);

    const assignment =
        await StaffUnitRepository.findById(id);

    if (!assignment) {
        throw new Error(
            "Staff-unit assignment not found"
        );
    }

    if (
        data.staffId &&
        data.staffId !== assignment.staffId
    ) {

        const staff =
            await Staff.findByPk(
                data.staffId
            );

        if (!staff) {
            throw new Error(
                "Staff not found"
            );
        }
    }

    if (
        data.unitId &&
        data.unitId !== assignment.unitId
    ) {

        const unit =
            await Unit.findByPk(
                data.unitId
            );

        if (!unit) {
            throw new Error(
                "Unit not found"
            );
        }
    }

    return await StaffUnitRepository.update(
        assignment,
        data
    );
};


const activateAssignment = async (
    id
) => {

    const assignment =
        await StaffUnitRepository.findById(id);

    if (!assignment) {
        throw new Error(
            "Staff-unit assignment not found"
        );
    }

    const staff =
        await Staff.findByPk(
            assignment.staffId
        );

    if (!staff) {
        throw new Error(
            "Staff not found"
        );
    }

    if (staff.status !== "ACTIVE") {
        throw new Error(
            "Cannot activate assignment for inactive staff"
        );
    }

    const existing =
        await StaffUnitRepository
            .findActiveByStaffAndUnit(
                assignment.staffId,
                assignment.unitId
            );

    if (
        existing &&
        existing.id !== assignment.id
    ) {
        throw new Error(
            "Another active assignment already exists"
        );
    }

    return await StaffUnitRepository.update(
        assignment,
        {
            status: "ACTIVE"
        }
    );
};


const deactivateAssignment = async (
    id
) => {

    const assignment =
        await StaffUnitRepository.findById(id);

    if (!assignment) {
        throw new Error(
            "Staff-unit assignment not found"
        );
    }

    return await StaffUnitRepository.update(
        assignment,
        {
            status: "INACTIVE"
        }
    );
};


const completeAssignment = async (
    id
) => {

    const assignment =
        await StaffUnitRepository.findById(id);

    if (!assignment) {
        throw new Error(
            "Staff-unit assignment not found"
        );
    }

    return await StaffUnitRepository.update(
        assignment,
        {
            status: "COMPLETED",
            endDate:
                assignment.endDate ||
                new Date()
                    .toISOString()
                    .split("T")[0]
        }
    );
};


const deleteAssignment = async (
    id
) => {

    const assignment =
        await StaffUnitRepository.findById(id);

    if (!assignment) {
        throw new Error(
            "Staff-unit assignment not found"
        );
    }

    await StaffUnitRepository.remove(
        assignment
    );

    return {
        message:
            "Staff-unit assignment deleted successfully"
    };
};


module.exports = {
    createAssignment,
    getAssignmentById,
    getAssignmentsByStaff,
    getAssignmentsByUnit,
    getAllAssignments,
    updateAssignment,
    activateAssignment,
    deactivateAssignment,
    completeAssignment,
    deleteAssignment
};