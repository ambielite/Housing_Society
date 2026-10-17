const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

module.exports = sequelize.define("CommunityVotingAudit", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    votingId: { type: DataTypes.UUID, allowNull: false, field: "voting_id" },
    societyId: { type: DataTypes.UUID, allowNull: false, field: "society_id" },
    actorId: { type: DataTypes.UUID, allowNull: true, field: "actor_id" },
    action: { type: DataTypes.STRING(60), allowNull: false },
    details: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    previousHash: { type: DataTypes.STRING(64), allowNull: true, field: "previous_hash" },
    eventHash: { type: DataTypes.STRING(64), allowNull: false, unique: true, field: "event_hash" },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "created_at" }
}, { tableName: "community_voting_audits", timestamps: false });
