const Society =
    require("../../societies/society/society.model");

const Staff =
    require("../staff/staff.model");

const Shift =
    require("./shift.model");

const RosterRepository =
    require("./roster.repository");

const {
    validateCreate,
    validateUpdate
} = require("./roster.validation");


const createRoster = async (
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

    const staff =
        await Staff.findByPk(
            data.staffId
        );

    if (!staff) {
        throw new Error(
            "Staff not found"
        );
    }

    if (staff.societyId !== data.societyId) {
        throw new Error(
            "Staff does not belong to this society"
        );
    }

    if (staff.status !== "ACTIVE") {
        throw new Error(
            "Only active staff can be assigned to a roster"
        );
    }

    const shift =
        await Shift.findByPk(
            data.shiftId
        );

    if (!shift) {
        throw new Error(
            "Shift not found"
        );
    }

    if (shift.societyId !== data.societyId) {
        throw new Error(
            "Shift does not belong to this society"
        );
    }

    if (shift.status !== "ACTIVE") {
        throw new Error(
            "Only active shifts can be assigned"
        );
    }

    const existing =
        await RosterRepository
            .findByStaffAndDate(
                data.staffId,
                data.rosterDate
            );

    if (existing) {
        throw new Error(
            "Roster already exists for this staff member on this date"
        );
    }

    return await RosterRepository.create(
        data
    );
};


const getRosterById = async (
    id
) => {

    const roster =
        await RosterRepository.findById(
            id
        );

    if (!roster) {
        throw new Error(
            "Roster not found"
        );
    }

    return roster;
};


const getAllRosters = async (
    filters = {}
) => {

    return await RosterRepository.findAll(
        filters
    );
};


const getRostersByStaff = async (
    staffId
) => {

    const staff =
        await Staff.findByPk(
            staffId
        );

    if (!staff) {
        throw new Error(
            "Staff not found"
        );
    }

    return await RosterRepository
        .findByStaffId(
            staffId
        );
};


const getRostersByDate = async (
    rosterDate
) => {

    return await RosterRepository
        .findByDate(
            rosterDate
        );
};


const updateRoster = async (
    id,
    data
) => {

    validateUpdate(data);

    const roster =
        await RosterRepository.findById(
            id
        );

    if (!roster) {
        throw new Error(
            "Roster not found"
        );
    }

    if (data.staffId) {

        const staff =
            await Staff.findByPk(
                data.staffId
            );

        if (!staff) {
            throw new Error(
                "Staff not found"
            );
        }

        if (staff.societyId !== roster.societyId) {
            throw new Error(
                "Staff does not belong to this society"
            );
        }
    }

    if (data.shiftId) {

        const shift =
            await Shift.findByPk(
                data.shiftId
            );

        if (!shift) {
            throw new Error(
                "Shift not found"
            );
        }

        if (
            shift.societyId !==
            roster.societyId
        ) {
            throw new Error(
                "Shift does not belong to this society"
            );
        }
    }

    return await RosterRepository.update(
        roster,
        data
    );
};


const confirmRoster = async (
    id
) => {

    const roster =
        await RosterRepository.findById(
            id
        );

    if (!roster) {
        throw new Error(
            "Roster not found"
        );
    }

    return await RosterRepository.update(
        roster,
        {
            status: "CONFIRMED"
        }
    );
};


const cancelRoster = async (
    id
) => {

    const roster =
        await RosterRepository.findById(
            id
        );

    if (!roster) {
        throw new Error(
            "Roster not found"
        );
    }

    return await RosterRepository.update(
        roster,
        {
            status: "CANCELLED"
        }
    );
};


const completeRoster = async (
    id
) => {

    const roster =
        await RosterRepository.findById(
            id
        );

    if (!roster) {
        throw new Error(
            "Roster not found"
        );
    }

    return await RosterRepository.update(
        roster,
        {
            status: "COMPLETED"
        }
    );
};


const deleteRoster = async (
    id
) => {

    const roster =
        await RosterRepository.findById(
            id
        );

    if (!roster) {
        throw new Error(
            "Roster not found"
        );
    }

    await RosterRepository.remove(
        roster
    );

    return {
        message:
            "Roster deleted successfully"
    };
};


module.exports = {
    createRoster,
    getRosterById,
    getAllRosters,
    getRostersByStaff,
    getRostersByDate,
    updateRoster,
    confirmRoster,
    cancelRoster,
    completeRoster,
    deleteRoster
};