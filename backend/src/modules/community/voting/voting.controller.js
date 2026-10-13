
const service =
    require("./voting.service");


// ============================================================
// VOTING
// ============================================================

const createVoting = async (req, res) => {

    try {

        const result =
            await service.createVoting(
                req.body
            );

        res.status(201).json({
            success: true,
            message: "Voting created successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const getVotings = async (req, res) => {

    try {

        const result =
            await service.getVotings(
                req.query
            );

        res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const getVotingById = async (req, res) => {

    try {

        const result =
            await service.getVotingById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });

    }
};


// ============================================================
// OPTIONS
// ============================================================

const addOption = async (req, res) => {

    try {

        const result =
            await service.addOption({
                ...req.body,
                votingId:
                    req.params.id
            });

        res.status(201).json({
            success: true,
            message: "Voting option added successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const getOptions = async (req, res) => {

    try {

        const result =
            await service.getOptions(
                req.params.id
            );

        res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


// ============================================================
// ELIGIBILITY
// ============================================================

const addEligibleVoter = async (req, res) => {

    try {

        const result =
            await service.addEligibleVoter({
                ...req.body,
                votingId:
                    req.params.id
            });

        res.status(201).json({
            success: true,
            message: "Eligible voter added successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


// ============================================================
// BALLOT
// ============================================================

const issueBallot = async (req, res) => {

    try {

        const result =
            await service.issueBallot(
                req.params.id,
                req.body.eligibilityId
            );

        res.status(201).json({
            success: true,
            message: "Ballot issued successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


// ============================================================
// OPEN
// ============================================================

const openVoting = async (req, res) => {

    try {

        const result =
            await service.openVoting(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Voting opened successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


// ============================================================
// CAST
// ============================================================

const castVote = async (req, res) => {

    try {

        const result =
            await service.castVote(
                req.body
            );

        res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


// ============================================================
// CLOSE
// ============================================================

const closeVoting = async (req, res) => {

    try {

        const result =
            await service.closeVoting(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Voting closed successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


// ============================================================
// COUNT
// ============================================================

const countVotes = async (req, res) => {

    try {

        const result =
            await service.countVotes(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Votes counted successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


// ============================================================
// CANCEL
// ============================================================

const cancelVoting = async (req, res) => {

    try {

        const result =
            await service.cancelVoting(
                req.params.id,
                req.body.reason
            );

        res.status(200).json({
            success: true,
            message: "Voting cancelled successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


// ============================================================
// GOVERNANCE RULES
// ============================================================

const createGovernanceRule = async (req, res) => {

    try {

        const result =
            await service.createGovernanceRule(
                req.body
            );

        res.status(201).json({
            success: true,
            message: "Governance rule created successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const getGovernanceRules = async (req, res) => {

    try {

        const result =
            await service.getGovernanceRules(
                req.params.societyId
            );

        res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const updateGovernanceRule = async (req, res) => {

    try {

        const result =
            await service.updateGovernanceRule(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Governance rule updated successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
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

