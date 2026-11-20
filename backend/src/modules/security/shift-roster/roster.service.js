const Society =
    require("../../societies/society/society.model");

const Staff =
    require("../staff/staff.model");

const Shift =
    require("./shift.model");

const sequelize = require("../../../config/database");
const Notification = require("../../notifications/notification/notification.model");
const securityEvents = require("../../gates/securityEvents");

const RosterRepository =
    require("./roster.repository");

const {
    validateCreate,
    validateUpdate
} = require("./roster.validation");

const roleLabels = {
    SOCIETY_ADMIN: "Society Admin",
    SUPER_ADMIN: "Super Admin",
    PRESIDENT_SECRETARY: "President/Secretary",
    SECURITY_HEAD: "Security Guard",
};

const actorDisplayName = (actor) => {
    const name = [actor?.firstName, actor?.lastName]
        .map((part) => String(part || "").trim())
        .filter(Boolean)
        .join(" ") || actor?.email || "Administrator";
    const roleCode = (actor?.roles || []).find((role) => roleLabels[role]);
    const role = roleLabels[roleCode] || "Administrator";
    return `${name} (${role})`;
};

const notifyGuardOfRoster = async (roster, title, message, actor) => {
    const [guardRows] = await sequelize.query(
        `SELECT user_id FROM security_guards
          WHERE staff_id = :staffId AND user_id IS NOT NULL
          LIMIT 1`,
        { replacements: { staffId: roster.staffId } }
    );
    const guardUserId = guardRows[0]?.user_id;
    if (!guardUserId) return;

    const actorName = actorDisplayName(actor);
    const now = new Date();
    await Notification.create({
        societyId: roster.societyId,
        userId: guardUserId,
        channel: "IN_APP",
        notificationType: "OPERATIONAL",
        title: `${title} by ${actorName}`,
        subject: `${title} by ${actorName}`,
        message: `${message} By ${actorName}.`,
        data: {
            rosterId: roster.id,
            staffId: roster.staffId,
            shiftId: roster.shiftId,
            rosterDate: roster.rosterDate,
        },
        referenceType: "STAFF_ROSTER",
        referenceId: roster.id,
        priority: "HIGH",
        status: "SENT",
        isRead: false,
        sentAt: now,
        deliveredAt: now,
    });
    securityEvents.publishRosterUpdated(guardUserId);
};

const findOverlappingRoster = async ({
    staffId,
    rosterDate,
    shift,
    excludeRosterId,
}) => {
    const [rows] = await sequelize.query(
        `WITH candidate AS (
             SELECT CAST(:rosterDate AS date) + CAST(:startTime AS time) AS starts_at,
                    CAST(:rosterDate AS date) + CAST(:endTime AS time)
                      + CASE WHEN :isOvernight OR CAST(:endTime AS time) <= CAST(:startTime AS time)
                             THEN INTERVAL '1 day' ELSE INTERVAL '0 days' END AS ends_at
         )
         SELECT roster.id, roster.roster_date AS "rosterDate", assigned_shift.shift_name AS "shiftName"
           FROM staff_rosters roster
           JOIN shifts assigned_shift ON assigned_shift.id = roster.shift_id
           CROSS JOIN candidate
          WHERE roster.staff_id = :staffId
            AND roster.status NOT IN ('CANCELLED', 'COMPLETED')
            AND roster.roster_date BETWEEN CAST(:rosterDate AS date) - 1
                                       AND CAST(:rosterDate AS date) + 1
            AND (:excludeRosterId IS NULL OR roster.id <> :excludeRosterId)
            AND roster.roster_date + assigned_shift.start_time < candidate.ends_at
            AND roster.roster_date + assigned_shift.end_time
                + CASE WHEN assigned_shift.is_overnight
                             OR assigned_shift.end_time <= assigned_shift.start_time
                       THEN INTERVAL '1 day' ELSE INTERVAL '0 days' END > candidate.starts_at
          LIMIT 1`,
        {
            replacements: {
                staffId,
                rosterDate,
                startTime: shift.startTime,
                endTime: shift.endTime,
                isOvernight: Boolean(shift.isOvernight),
                excludeRosterId: excludeRosterId || null,
            },
        }
    );
    return rows[0] || null;
};


const createRoster = async (
    data,
    actor
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

    if (!['CANCELLED', 'COMPLETED'].includes(data.status)) {
        const conflict = await findOverlappingRoster({
            staffId: data.staffId,
            rosterDate: data.rosterDate,
            shift,
        });
        if (conflict) {
            throw new Error(
                `This guard already has ${conflict.shiftName} scheduled during that time.`
            );
        }
    }

    const roster = await RosterRepository.create(data);
    await notifyGuardOfRoster(
        roster,
        "New shift assigned",
        `Your ${shift.shiftName} shift is scheduled for ${roster.rosterDate}.`,
        actor
    );
    return roster;
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


const attachCancellationActors = async (rosters) => {
    const cancelledByIds = [...new Set(rosters
        .map((roster) => roster.cancelledBy)
        .filter(Boolean))];
    if (!cancelledByIds.length) return rosters;

    const [actors] = await sequelize.query(
        `SELECT roster.id AS roster_id,
                COALESCE(NULLIF(trim(concat_ws(' ', u.first_name, u.last_name)), ''), u.email, 'Unknown user') AS name,
                actor_role.name AS role_name,
                EXISTS (
                    SELECT 1
                      FROM security_guards guard
                     WHERE guard.user_id = u.id AND guard.staff_id = roster.staff_id
                ) AS is_security_guard
           FROM staff_rosters roster
           JOIN users u ON u.id = roster.cancelled_by
           LEFT JOIN LATERAL (
                SELECT r.name
                  FROM user_roles ur
                  JOIN roles r ON r.id = ur.role_id
                 WHERE ur.user_id = u.id
                   AND r.status = 'ACTIVE'
                   AND (ur.society_id = roster.society_id OR ur.society_id IS NULL)
                 ORDER BY CASE r.code
                              WHEN 'SOCIETY_ADMIN' THEN 1
                              WHEN 'SUPER_ADMIN' THEN 2
                              WHEN 'PRESIDENT_SECRETARY' THEN 3
                              ELSE 4
                          END,
                          CASE WHEN ur.society_id = roster.society_id THEN 0 ELSE 1 END
                 LIMIT 1
           ) actor_role ON TRUE
          WHERE roster.cancelled_by IN (:ids)`,
        { replacements: { ids: cancelledByIds } }
    );
    const actorByRosterId = new Map(actors.map((actor) => [String(actor.roster_id), actor]));
    for (const roster of rosters) {
        const actor = actorByRosterId.get(String(roster.id));
        const displayName = actor?.name
            ? actor.role_name && !actor.is_security_guard
                ? `${actor.name} (${actor.role_name})`
                : actor.name
            : null;
        roster.setDataValue('cancelledByName', displayName);
        roster.setDataValue('cancelledBySecurityGuard', Boolean(actor?.is_security_guard));
    }
    return rosters;
};

const getAllRosters = async (filters = {}) => {
    return attachCancellationActors(await RosterRepository.findAll(filters));
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

    return attachCancellationActors(await RosterRepository.findByStaffId(staffId));
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
    data,
    actor
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

    if (roster.status === "CANCELLED" && data.status && data.status !== "CANCELLED") {
        throw new Error("A cancelled schedule cannot be changed to another status");
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

    const targetStaffId = data.staffId || roster.staffId;
    const targetShiftId = data.shiftId || roster.shiftId;
    const targetRosterDate = data.rosterDate || roster.rosterDate;
    const targetStatus = data.status || roster.status;
    const scheduleChanged = Boolean(
        data.staffId || data.shiftId || data.rosterDate ||
        (data.status && data.status !== roster.status)
    );
    if (scheduleChanged && !["CANCELLED", "COMPLETED"].includes(targetStatus)) {
        const targetShift = await Shift.findByPk(targetShiftId);
        const conflict = await findOverlappingRoster({
            staffId: targetStaffId,
            rosterDate: targetRosterDate,
            shift: targetShift,
            excludeRosterId: roster.id,
        });
        if (conflict) {
            throw new Error(
                `This guard already has ${conflict.shiftName} scheduled during that time.`
            );
        }
    }

    const updatedRoster = await RosterRepository.update(roster, data);
    if (data.staffId || data.shiftId || data.rosterDate) {
        const assignedShift = await Shift.findByPk(updatedRoster.shiftId);
        await notifyGuardOfRoster(
            updatedRoster,
            "Shift schedule updated",
            `Your ${assignedShift?.shiftName || "shift"} schedule was updated for ${updatedRoster.rosterDate}.`,
            actor
        );
    }
    return updatedRoster;
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

    if (roster.status === "CANCELLED") {
        throw new Error("A cancelled schedule cannot be confirmed");
    }
    if (roster.status === "COMPLETED") {
        throw new Error("This schedule is already complete");
    }

    return await RosterRepository.update(
        roster,
        {
            status: "CONFIRMED"
        }
    );
};


const cancelRoster = async (
    id,
    user,
    reason
) => {
    const cancellationReason = typeof reason === "string" ? reason.trim() : "";
    if (cancellationReason.length < 5 || cancellationReason.length > 1000) {
        throw new Error("Please enter a cancellation reason (5 to 1000 characters)");
    }
    let guardUserId;
    const result = await sequelize.transaction(async (transaction) => {
        const roster = await RosterRepository.findById(id, { transaction });
        if (!roster) throw new Error("Roster not found");
        if (["CANCELLED", "COMPLETED"].includes(roster.status)) {
            throw new Error("This shift is already cancelled or completed");
        }

        const shift = await Shift.findByPk(roster.shiftId, { transaction });
        const cancelledAt = new Date();
        const adminName = actorDisplayName(user);
        await RosterRepository.update(roster, {
            status: "CANCELLED",
            cancellationReason,
            cancelledAt,
            cancelledBy: user?.id || null,
        }, { transaction });

        const [guardRows] = await sequelize.query(
            `SELECT g.user_id
               FROM security_guards g
               JOIN staff s ON s.id = g.staff_id
              WHERE g.staff_id = :staffId
                AND s.society_id = :societyId
              LIMIT 1`,
            { replacements: { staffId: roster.staffId, societyId: roster.societyId }, transaction }
        );
        guardUserId = guardRows[0]?.user_id;
        if (guardUserId) {
            await Notification.create({
                societyId: roster.societyId,
                userId: guardUserId,
                channel: "IN_APP",
                notificationType: "OPERATIONAL",
                title: `Shift cancelled by ${adminName}`,
                subject: `Shift cancelled by ${adminName}`,
                message: `Your ${shift?.shiftName || "assigned shift"} on ${roster.rosterDate} was cancelled by ${adminName}. Reason: ${cancellationReason}`,
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
                status: "SENT",
                isRead: false,
            }, { transaction });
        }
        return roster;
    });
    securityEvents.publishRosterUpdated(guardUserId);
    return result;
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

    if (roster.status === "CANCELLED") {
        throw new Error("A cancelled schedule cannot be marked complete");
    }
    if (roster.status === "COMPLETED") {
        throw new Error("This schedule is already complete");
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
