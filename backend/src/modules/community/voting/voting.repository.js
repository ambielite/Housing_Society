
const { Op } = require("sequelize");

const CommunityVoting =
    require("./voting.model");

const CommunityVotingOption =
    require("./votingOption.model");

const CommunityVotingEligibility =
    require("./votingEligibility.model");

const CommunityVotingBallot =
    require("./votingBallot.model");

const CommunityVotingVote =
    require("./votingVote.model");

const CommunityGovernanceRule =
    require("./governanceRule.model");
const CommunityVotingOtp = require("./votingOtp.model");
const CommunityVotingAudit = require("./votingAudit.model");
const sequelize = require("../../../config/database");


// ============================================================
// VOTING
// ============================================================

const createVoting = async (data) => {
    return await CommunityVoting.create(data);
};

const findVotingById = async (id) => {
    return await CommunityVoting.findByPk(id);
};

const findVotings = async (where = {}) => {
    return await CommunityVoting.findAll({
        where,
        order: [
            ["created_at", "DESC"]
        ]
    });
};

const updateVoting = async (voting, data) => {
    return await voting.update(data);
};


// ============================================================
// OPTIONS
// ============================================================

const createOption = async (data) => {
    return await CommunityVotingOption.create(data);
};

const findOptionById = async (id) => {
    return await CommunityVotingOption.findByPk(id);
};

const findOptions = async (where = {}) => {
    return await CommunityVotingOption.findAll({
        where,
        order: [
            ["displayOrder", "ASC"]
        ]
    });
};


// ============================================================
// ELIGIBILITY
// ============================================================

const createEligibility = async (data) => {
    return await CommunityVotingEligibility.create(data);
};

const findEligibility = async (where) => {
    return await CommunityVotingEligibility.findOne({
        where
    });
};

const findEligibilities = async (where = {}) => {
    return await CommunityVotingEligibility.findAll({
        where
    });
};

const updateEligibility = async (
    eligibility,
    data
) => {
    return await eligibility.update(data);
};


// ============================================================
// BALLOT
// ============================================================

const createBallot = async (data) => {
    return await CommunityVotingBallot.create(data);
};

const findBallotById = async (id) => {
    return await CommunityVotingBallot.findByPk(id);
};

const findBallot = async (where) => {
    return await CommunityVotingBallot.findOne({
        where
    });
};

const updateBallot = async (
    ballot,
    data
) => {
    return await ballot.update(data);
};


// ============================================================
// VOTE
// ============================================================

const createVote = async (data) => {
    return await CommunityVotingVote.create(data);
};

const findVotes = async (where = {}) => {
    return await CommunityVotingVote.findAll({
        where
    });
};

const countVotes = async (where = {}) => {
    return await CommunityVotingVote.count({
        where
    });
};


// ============================================================
// GOVERNANCE RULE
// ============================================================

const createRule = async (data) => {
    return await CommunityGovernanceRule.create(data);
};

const findRules = async (where = {}) => {
    return await CommunityGovernanceRule.findAll({
        where,
        order: [
            ["created_at", "DESC"]
        ]
    });
};

const findRuleById = async (id) => {
    return await CommunityGovernanceRule.findByPk(id);
};

const updateRule = async (rule, data) => {
    return await rule.update(data);
};

const createOtp = async (data) => CommunityVotingOtp.create(data);
const findLatestOtp = async (where) => CommunityVotingOtp.findOne({ where, order: [["createdAt", "DESC"]] });
const updateOtp = async (otp, data) => otp.update(data);
const consumeOtp = async (otpId, codeHash) => CommunityVotingOtp.update(
    { verifiedAt: new Date(), usedAt: new Date() },
    { where: { id: otpId, codeHash, verifiedAt: null, usedAt: null, expiresAt: { [Op.gt]: new Date() }, attempts: { [Op.lt]: 5 } } }
);

const issueBallotAfterOtp = async ({ otp, codeHash, votingId, eligibilityId, ballotTokenHash }) => sequelize.transaction(async (transaction) => {
    await sequelize.query("SELECT pg_advisory_xact_lock(hashtext('community-voting-ballot'), hashtext(:eligibilityId))", { replacements: { eligibilityId }, transaction });
    const existing = await CommunityVotingBallot.findOne({ where: { eligibilityId }, transaction });
    if (existing) throw new Error("A ballot has already been issued for this eligibility record");
    const [consumed] = await CommunityVotingOtp.update(
        { verifiedAt: new Date(), usedAt: new Date() },
        { where: { id: otp.id, codeHash, verifiedAt: null, usedAt: null, expiresAt: { [Op.gt]: new Date() }, attempts: { [Op.lt]: 5 } }, transaction }
    );
    if (!consumed) throw new Error("This verification code was already used or expired. Request a new code.");
    return CommunityVotingBallot.create({ votingId, eligibilityId, ballotTokenHash, status: "ISSUED" }, { transaction });
});

const castVoteAtomically = async ({ ballot, eligibility, vote }) => sequelize.transaction(async (transaction) => {
    const [used] = await CommunityVotingBallot.update(
        { status: "USED", usedAt: new Date() },
        { where: { id: ballot.id, status: "ISSUED" }, transaction }
    );
    if (!used) throw new Error("This ballot has already been used or is invalid");
    await CommunityVotingVote.create(vote, { transaction });
    await eligibility.update({ hasVoted: true, votedAt: new Date() }, { transaction });
});

const appendAudit = async ({ votingId, societyId, actorId, action, details, eventHash }) => sequelize.transaction(async (transaction) => {
    await sequelize.query("SELECT pg_advisory_xact_lock(hashtext('community-voting-audit'), hashtext(:votingId))", { replacements: { votingId }, transaction });
    const previous = await CommunityVotingAudit.findOne({ where: { votingId }, order: [["createdAt", "DESC"], ["id", "DESC"]], transaction });
    const previousHash = previous?.eventHash || null;
    const canonical = JSON.stringify({ votingId, societyId, actorId: actorId || null, action, details: details || {}, previousHash, at: new Date().toISOString() });
    const crypto = require("crypto");
    const hash = crypto.createHash("sha256").update(canonical).digest("hex");
    return CommunityVotingAudit.create({ votingId, societyId, actorId: actorId || null, action, details: { ...(details || {}), canonicalEvent: canonical }, previousHash, eventHash: hash }, { transaction });
});

const findAudits = async (votingId) => CommunityVotingAudit.findAll({ where: { votingId }, order: [["createdAt", "ASC"], ["id", "ASC"]] });


module.exports = {
    createVoting,
    findVotingById,
    findVotings,
    updateVoting,

    createOption,
    findOptionById,
    findOptions,

    createEligibility,
    findEligibility,
    findEligibilities,
    updateEligibility,

    createBallot,
    findBallotById,
    findBallot,
    updateBallot,

    createVote,
    findVotes,
    countVotes,

    createRule,
    findRules,
    findRuleById,
    updateRule,
    createOtp,
    findLatestOtp,
    updateOtp,
    consumeOtp,
    issueBallotAfterOtp,
    castVoteAtomically,
    appendAudit,
    findAudits
};

