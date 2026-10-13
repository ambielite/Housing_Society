
const crypto = require("crypto");

const Society =
    require("../../../modules/societies/society/society.model");

const repository =
    require("./voting.repository");

const {
    validateCreateVoting,
    validateCreateOption,
    validateEligibility,
    validateCastVote,
    validateGovernanceRule
} = require("./voting.validation");


// ============================================================
// HELPER - HASH TOKEN
// ============================================================

const hashToken = (token) => {

    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};

// E-voting remains disabled unless the formally approved requirements have
// been independently reviewed and the deployment is explicitly enabled.
const assertElectronicVotingEnabled = () => {
    if (process.env.COMMUNITY_E_VOTING_APPROVED !== "true") {
        throw new Error(
            "Electronic voting is disabled until eligibility, quorum, ballot secrecy and audit requirements are formally approved"
        );
    }
};


// ============================================================
// CREATE VOTING
// ============================================================

const createVoting = async (data) => {

    validateCreateVoting(data);

    const society =
        await Society.findByPk(data.societyId);

    if (!society) {
        throw new Error("Society not found");
    }

    return await repository.createVoting({
        ...data,
        status: "DRAFT"
    });
};


// ============================================================
// GET VOTINGS
// ============================================================

const getVotings = async (filters = {}) => {

    const where = {};

    if (filters.societyId) {
        where.societyId =
            filters.societyId;
    }

    if (filters.governanceMeetingId) {
        where.governanceMeetingId =
            filters.governanceMeetingId;
    }

    if (filters.meetingId) {
        where.meetingId =
            filters.meetingId;
    }

    if (filters.status) {
        where.status =
            filters.status;
    }

    if (filters.votingType) {
        where.votingType =
            filters.votingType;
    }

    return await repository.findVotings(
        where
    );
};


// ============================================================
// GET VOTING
// ============================================================

const getVotingById = async (id) => {

    const voting =
        await repository.findVotingById(id);

    if (!voting) {
        throw new Error(
            "Voting event not found"
        );
    }

    return voting;
};


// ============================================================
// ADD OPTION
// ============================================================

const addOption = async (data) => {

    validateCreateOption(data);

    const voting =
        await repository.findVotingById(
            data.votingId
        );

    if (!voting) {
        throw new Error(
            "Voting event not found"
        );
    }

    if (voting.status !== "DRAFT") {
        throw new Error(
            "Options can only be added while voting is in DRAFT"
        );
    }

    return await repository.createOption(
        data
    );
};


// ============================================================
// GET OPTIONS
// ============================================================

const getOptions = async (votingId) => {

    return await repository.findOptions({
        votingId
    });
};


// ============================================================
// ADD ELIGIBLE VOTER
// ============================================================

const addEligibleVoter = async (data) => {

    validateEligibility(data);

    const voting =
        await repository.findVotingById(
            data.votingId
        );

    if (!voting) {
        throw new Error(
            "Voting event not found"
        );
    }

    if (
        !["DRAFT", "SCHEDULED"]
            .includes(voting.status)
    ) {
        throw new Error(
            "Eligibility cannot be changed after voting starts"
        );
    }

    const existing =
        await repository.findEligibility({
            votingId: data.votingId,
            userId: data.userId
        });

    if (existing) {
        throw new Error(
            "User is already registered for this voting"
        );
    }

    return await repository.createEligibility({
        ...data,
        eligibilityStatus:
            data.eligibilityStatus ||
            "ELIGIBLE"
    });
};


// ============================================================
// ISSUE BALLOT
// ============================================================

const issueBallot = async (
    votingId,
    eligibilityId
) => {

    assertElectronicVotingEnabled();

    const voting =
        await repository.findVotingById(
            votingId
        );

    if (!voting) {
        throw new Error(
            "Voting event not found"
        );
    }

    if (
        !["SCHEDULED", "OPEN"]
            .includes(voting.status)
    ) {
        throw new Error(
            "Ballots cannot be issued in the current status"
        );
    }

    const eligibility =
        await repository.findEligibility({
            id: eligibilityId,
            votingId
        });

    if (!eligibility) {
        throw new Error(
            "Eligible voter not found"
        );
    }

    if (
        eligibility.eligibilityStatus !==
        "ELIGIBLE"
    ) {
        throw new Error(
            "This user is not eligible to vote"
        );
    }

    const existing =
        await repository.findBallot({
            eligibilityId
        });

    if (existing) {
        throw new Error(
            "Ballot already issued"
        );
    }

    const rawToken =
        crypto.randomBytes(32).toString("hex");

    const ballot =
        await repository.createBallot({
            votingId,
            eligibilityId,
            ballotTokenHash:
                hashToken(rawToken),
            status: "ISSUED"
        });

    return {
        ballotId: ballot.id,
        ballotToken: rawToken,
        status: ballot.status
    };
};


// ============================================================
// OPEN VOTING
// ============================================================

const openVoting = async (id) => {

    assertElectronicVotingEnabled();

    const voting =
        await repository.findVotingById(id);

    if (!voting) {
        throw new Error(
            "Voting event not found"
        );
    }

    if (
        !["DRAFT", "SCHEDULED"]
            .includes(voting.status)
    ) {
        throw new Error(
            "Voting cannot be opened in the current status"
        );
    }

    const options =
        await repository.findOptions({
            votingId: id,
            isActive: true
        });

    if (options.length < 2) {
        throw new Error(
            "At least two active voting options are required"
        );
    }

    const eligible =
        await repository.findEligibilities({
            votingId: id,
            eligibilityStatus: "ELIGIBLE"
        });

    if (eligible.length === 0) {
        throw new Error(
            "At least one eligible voter is required"
        );
    }

    return await repository.updateVoting(
        voting,
        {
            status: "OPEN",
            startAt:
                voting.startAt ||
                new Date(),
            eligibleVoterCount:
                eligible.length
        }
    );
};


// ============================================================
// CAST VOTE
// ============================================================

const castVote = async (data) => {

    assertElectronicVotingEnabled();

    validateCastVote(data);

    const ballot =
        await repository.findBallot({
            ballotTokenHash:
                hashToken(data.ballotToken)
        });

    if (!ballot) {
        throw new Error(
            "Invalid ballot token"
        );
    }

    if (ballot.status !== "ISSUED") {
        throw new Error(
            "This ballot has already been used or is invalid"
        );
    }

    const voting =
        await repository.findVotingById(
            ballot.votingId
        );

    if (!voting) {
        throw new Error(
            "Voting event not found"
        );
    }

    if (voting.status !== "OPEN") {
        throw new Error(
            "Voting is not currently open"
        );
    }

    if (
        voting.endAt &&
        new Date() > new Date(voting.endAt)
    ) {
        throw new Error(
            "Voting period has ended"
        );
    }

    const option =
        await repository.findOptionById(
            data.optionId
        );

    if (!option) {
        throw new Error(
            "Voting option not found"
        );
    }

    if (
        option.votingId !== voting.id
    ) {
        throw new Error(
            "Option does not belong to this voting"
        );
    }

    if (!option.isActive) {
        throw new Error(
            "Voting option is inactive"
        );
    }

    await repository.createVote({
        votingId: voting.id,
        ballotId: ballot.id,
        optionId: option.id
    });

    await repository.updateBallot(
        ballot,
        {
            status: "USED",
            usedAt: new Date()
        }
    );

    const eligibility =
        await repository.findEligibility({
            id: ballot.eligibilityId
        });

    if (eligibility) {
        await repository.updateEligibility(
            eligibility,
            {
                hasVoted: true,
                votedAt: new Date()
            }
        );
    }

    return {
        success: true,
        message: "Vote cast successfully"
    };
};


// ============================================================
// CLOSE VOTING
// ============================================================

const closeVoting = async (id) => {

    assertElectronicVotingEnabled();

    const voting =
        await repository.findVotingById(id);

    if (!voting) {
        throw new Error(
            "Voting event not found"
        );
    }

    if (voting.status !== "OPEN") {
        throw new Error(
            "Only open voting can be closed"
        );
    }

    return await repository.updateVoting(
        voting,
        {
            status: "CLOSED"
        }
    );
};


// ============================================================
// COUNT VOTES
// ============================================================

const countVotes = async (id) => {

    assertElectronicVotingEnabled();

    const voting =
        await repository.findVotingById(id);

    if (!voting) {
        throw new Error(
            "Voting event not found"
        );
    }

    if (
        !["CLOSED", "COUNTING"]
            .includes(voting.status)
    ) {
        throw new Error(
            "Voting must be closed before counting"
        );
    }

    await repository.updateVoting(
        voting,
        {
            status: "COUNTING"
        }
    );

    const options =
        await repository.findOptions({
            votingId: id
        });

    const results = [];

    let totalVotes = 0;

    for (const option of options) {

        const count =
            await repository.countVotes({
                votingId: id,
                optionId: option.id
            });

        totalVotes += count;

        results.push({
            optionId: option.id,
            optionCode: option.optionCode,
            optionLabel: option.optionLabel,
            voteCount: count
        });

        await option.update({
            voteCount: count
        });
    }

    const quorumReached =
        voting.quorumRequired === 0
            ? true
            : totalVotes >=
              voting.quorumRequired;

    return await repository.updateVoting(
        voting,
        {
            status: "RESULT_DECLARED",
            voteCount: totalVotes,
            quorumReached,
            resultData: {
                totalVotes,
                quorumReached,
                options: results
            },
            resultDeclaredAt: new Date()
        }
    );
};


// ============================================================
// CANCEL
// ============================================================

const cancelVoting = async (
    id,
    reason
) => {

    const voting =
        await repository.findVotingById(id);

    if (!voting) {
        throw new Error(
            "Voting event not found"
        );
    }

    if (
        [
            "RESULT_DECLARED",
            "CANCELLED"
        ].includes(voting.status)
    ) {
        throw new Error(
            "Voting cannot be cancelled"
        );
    }

    return await repository.updateVoting(
        voting,
        {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancellationReason: reason
        }
    );
};


// ============================================================
// GOVERNANCE RULES
// ============================================================

const createGovernanceRule = async (data) => {

    validateGovernanceRule(data);

    const society =
        await Society.findByPk(
            data.societyId
        );

    if (!society) {
        throw new Error(
            "Society not found"
        );
    }

    return await repository.createRule(
        data
    );
};


const getGovernanceRules = async (
    societyId
) => {

    return await repository.findRules({
        societyId
    });
};


const updateGovernanceRule = async (
    id,
    data
) => {

    const rule =
        await repository.findRuleById(id);

    if (!rule) {
        throw new Error(
            "Governance rule not found"
        );
    }

    return await repository.updateRule(
        rule,
        data
    );
};


module.exports = {
    createVoting,
    getVotings,
    getVotingById,
    addOption,
    getOptions,
    addEligibleVoter,
    issueBallot,
    openVoting,
    castVote,
    closeVoting,
    countVotes,
    cancelVoting,
    createGovernanceRule,
    getGovernanceRules,
    updateGovernanceRule
};

