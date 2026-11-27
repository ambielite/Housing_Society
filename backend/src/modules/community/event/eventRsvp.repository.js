const CommunityEventRsvp =
    require("./eventRsvp.model");
const { QueryTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const create = async (data, options = {}) => {
    return await CommunityEventRsvp.create(data, options);
};

const findAll = async (where = {}) => {
    const rsvps = await CommunityEventRsvp.findAll({
        where,
        order: [
            ["registeredAt", "ASC"]
        ]
    });
    if (!rsvps.length) return [];

    const participants = await sequelize.query(
        `SELECT account.id AS user_id,
                COALESCE(NULLIF(resident.display_name, ''), NULLIF(concat_ws(' ', account.first_name, account.last_name), '')) AS participant_name,
                COALESCE(NULLIF(resident.mobile, ''), NULLIF(account.phone, '')) AS participant_phone,
                COALESCE(NULLIF(resident.email, ''), NULLIF(account.email, '')) AS participant_email
           FROM users account
           LEFT JOIN LATERAL (
                SELECT display_name, mobile, email
                  FROM residents
                 WHERE user_id = account.id
                   AND society_id = account.society_id
                   AND status = 'ACTIVE'
                 ORDER BY id
                 LIMIT 1
           ) resident ON true
          WHERE account.id IN (:userIds)`,
        {
            replacements: { userIds: [...new Set(rsvps.map((rsvp) => rsvp.userId))] },
            type: QueryTypes.SELECT,
        }
    );
    const participantByUserId = new Map(participants.map((participant) => [participant.user_id, participant]));

    return rsvps.map((rsvp) => {
        const record = rsvp.toJSON();
        const participant = participantByUserId.get(record.userId);
        return {
            ...record,
            participantName: participant?.participant_name || "Resident",
            participantPhone: participant?.participant_phone || null,
            participantEmail: participant?.participant_email || null,
        };
    });
};

const findById = async (id) => {
    return await CommunityEventRsvp.findByPk(id);
};

const findOne = async (where, options = {}) => {
    return await CommunityEventRsvp.findOne({
        where,
        ...options,
    });
};

const count = async (where = {}) => {
    return await CommunityEventRsvp.count({
        where
    });
};

const countSeats = async (eventId, transaction) => {
    const [result] = await sequelize.query(
        `SELECT COALESCE(SUM(total_tickets + guest_count), 0)::int AS seats
           FROM community_event_rsvps
          WHERE event_id = :eventId AND status IN ('REGISTERED', 'CHECKED_IN')`,
        { replacements: { eventId }, transaction, type: QueryTypes.SELECT },
    );
    return Number(result?.seats || 0);
};

const update = async (rsvp, data) => {
    return await rsvp.update(data);
};

const deleteRsvp = async (rsvp) => {
    return await rsvp.destroy();
};

module.exports = {
    create,
    findAll,
    findById,
    findOne,
    count,
    countSeats,
    update,
    deleteRsvp
};
