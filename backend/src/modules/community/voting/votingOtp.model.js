const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

module.exports = sequelize.define("CommunityVotingOtp", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    votingId: { type: DataTypes.UUID, allowNull: false, field: "voting_id" },
    eligibilityId: { type: DataTypes.UUID, allowNull: false, field: "eligibility_id" },
    codeHash: { type: DataTypes.STRING(64), allowNull: false, field: "code_hash" },
    expiresAt: { type: DataTypes.DATE, allowNull: false, field: "expires_at" },
    verifiedAt: { type: DataTypes.DATE, allowNull: true, field: "verified_at" },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    usedAt: { type: DataTypes.DATE, allowNull: true, field: "used_at" },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "created_at" }
}, { tableName: "community_voting_otps", timestamps: false });
