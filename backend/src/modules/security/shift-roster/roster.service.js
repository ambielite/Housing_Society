const Society =
    require("../../societies/society/society.model");

const Staff =
    require("../staff/staff.model");

const Shift =
    require("./shift.model");

const sequelize = require("../../../config/database");
const Notification = require("../../notifications/notification/notification.model");

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


const cancelRosterByGuard = async (id, user, reason) => {
    const cancellationReason = typeof reason === "string" ? reason.trim() : "";
    if (cancellationReason.length < 5 || cancellationReason.length > 1000) {
        throw new Error("Please enter a cancellation reason (5 to 1000 characters)");
    }
    if (!user?.roles?.includes("SECURITY_HEAD")) {
        throw new Error("Only the assigned security guard can cancel this shift");
    }

    return sequelize.transaction(async (transaction) => {
        const roster = await RosterRepository.findById(id, { transaction });
        if (!roster) throw new Error("Roster not found");
        if (["CANCELLED", "COMPLETED"].includes(roster.status)) {
            throw new Error("This shift is already cancelled or completed");
        }

        const [guardRows] = await sequelize.query(
            `SELECT g.staff_id
             FROM security_guards g
             JOIN staff s ON s.id = g.staff_id
             WHERE g.user_id = :userId
               AND s.society_id = :societyId
               AND s.staff_type = 'SECURITY_GUARD'
             LIMIT 1`,
            { replacements: { userId: user.id, societyId: roster.societyId }, transaction }
        );
        if (!guardRows.length || guardRows[0].staff_id !== roster.staffId) {
            throw new Error("You can only cancel a shift assigned to you");
        }

        const [shift, society, staff] = await Promise.all([
            Shift.findByPk(roster.shiftId, { transaction }),
            Society.findByPk(roster.societyId, { transaction }),
            Staff.findByPk(roster.staffId, { transaction }),
        ]);
        if (!shift || !society) throw new Error("Shift details could not be found");

        const [scheduleRows] = await sequelize.query(
            `SELECT
               ((CAST(:rosterDate AS date) + CAST(:startTime AS time)) AT TIME ZONE :timezone) AS starts_at,
               ((CAST(:rosterDate AS date) + CAST(:endTime AS time)
                 + CASE WHEN :overnight THEN INTERVAL '1 day' ELSE INTERVAL '0 day' END)
                 AT TIME ZONE :timezone) AS ends_at`,
            {
                replacements: {
                    rosterDate: roster.rosterDate,
                    startTime: shift.startTime,
                    endTime: shift.endTime,
                    overnight: shift.isOvernight || shift.endTime <= shift.startTime,
                    timezone: society.timezone || "Asia/Kolkata",
                },
                transaction,
            }
        );
        const now = Date.now();
        const startsAt = new Date(scheduleRows[0].starts_at).getTime();
        const endsAt = new Date(scheduleRows[0].ends_at).getTime();
        if (!(now < endsAt)) {
            throw new Error("A shift can only be cancelled before its scheduled end time");
        }

        const cancelledAt = new Date();
        await RosterRepository.update(roster, {
            status: "CANCELLED",
            cancellationReason,
            cancelledAt,
            cancelledBy: user.id,
        }, { transaction });

        const [adminRows] = await sequelize.query(
            `SELECT DISTINCT u.id AS user_id
             FROM users u
             JOIN user_roles ur ON ur.user_id = u.id
             JOIN roles r ON r.id = ur.role_id
             WHERE u.status = 'ACTIVE'
               AND r.code IN ('SOCIETY_ADMIN', 'SUPER_ADMIN', 'PRESIDENT_SECRETARY')
               AND (ur.society_id = :societyId OR (r.code = 'SUPER_ADMIN' AND ur.society_id IS NULL))
               AND u.id <> :guardUserId`,
            { replacements: { societyId: roster.societyId, guardUserId: user.id }, transaction }
        );
        if (adminRows.length) {
            const guardName = [staff?.firstName, staff?.lastName].filter(Boolean).join(" ") || "A security guard";
            await Notification.bulkCreate(
                adminRows.map(({ user_id: userId }) => ({
                    societyId: roster.societyId,
                    userId,
                    channel: "IN_APP",
                    notificationType: "OPERATIONAL",
                    title: "Security shift cancelled",
                    subject: "Security shift cancelled",
                    message: `${guardName} cancelled ${shift?.shiftName || "a shift"} on ${roster.rosterDate}. Reason: ${cancellationReason}`,
                    data: {
                        rosterId: roster.id,
                        staffId: roster.staffId,
                        shiftId: roster.shiftId,
                        reason: cancellationReason,
                        cancelledAt: cancelledAt.toISOString(),
                    },
                    referenceType: "STAFF_ROSTER",
                    referenceId: roster.id,
                    priority: "HIGH",
                })),
                { transaction }
            );
        }
        return roster;
    });
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
    cancelRosterByGuard,
    completeRoster,
    deleteRoster
};
