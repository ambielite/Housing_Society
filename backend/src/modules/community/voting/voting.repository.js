
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
    updateRule
};

