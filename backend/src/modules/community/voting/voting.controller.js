
const service =
    require("./voting.service");


// ============================================================
// VOTING
// ============================================================

const createVoting = async (req, res) => {

    try {

        const result =
            await service.createVoting(
                { ...req.body, createdBy: req.user?.id }
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
                votingId: req.params.id,
                createdBy: req.user?.id
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
            }, req.user?.id);

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

const getEligibleVoters = async (req, res) => {
    try {
        const result = await service.getEligibleVoters(req.params.id);
        res.json({ success: true, count: result.length, data: result });
    } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

const getVotingAccounts = async (req, res) => {
    try {
        const result = await service.getVotingAccounts(req.params.id);
        res.json({ success: true, count: result.length, data: result });
    } catch (error) { res.status(400).json({ success: false, message: error.message }); }
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
                req.params.id,
                req.user?.id
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
                req.params.id,
                req.user?.id
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
                req.params.id,
                req.user?.id
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
                req.body.reason,
                req.user?.id
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
                { ...req.body, updatedBy: req.user?.id }
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

const configureVoting = async (req, res) => {
    try { res.json({ success: true, data: await service.updateVotingConfiguration(req.params.id, req.body, req.user?.id) }); }
    catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

const approveVotingRules = async (req, res) => {
    try { res.json({ success: true, data: await service.approveRules(req.params.id, req.user?.id) }); }
    catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

const revokeVotingRules = async (req, res) => {
    try { res.json({ success: true, data: await service.revokeRulesApproval(req.params.id, req.user?.id) }); }
    catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

const reviewCandidate = async (req, res) => {
    try { res.json({ success: true, data: await service.reviewCandidate(req.params.id, req.params.optionId, { ...req.body, actorId: req.user?.id }) }); }
    catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

const verifyVoterIdentity = async (req, res) => {
    try { res.json({ success: true, data: await service.verifyVoterIdentity(req.params.id, req.params.eligibilityId, req.body.verified, req.user?.id) }); }
    catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

const requestVoteOtp = async (req, res) => {
    try { res.json({ success: true, data: await service.requestVoteOtp(req.params.id, req.user?.id) }); }
    catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

const verifyVoteOtp = async (req, res) => {
    try { res.json({ success: true, data: await service.verifyVoteOtp(req.params.id, req.user?.id, req.body.code) }); }
    catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

const publishResults = async (req, res) => {
    try { res.json({ success: true, data: await service.publishResults(req.params.id, req.user?.id) }); }
    catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

const exportReport = async (req, res) => {
    try {
        const csv = await service.exportReport(req.params.id);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="election-${req.params.id}-report.csv"`);
        res.send(`\uFEFF${csv}`);
    } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

const getAuditEvents = async (req, res) => {
    try { res.json({ success: true, data: await service.getAuditEvents(req.params.id) }); }
    catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

const scheduleVoting = async (req, res) => {
    try { res.json({ success: true, data: await service.scheduleVoting(req.params.id, req.user?.id) }); }
    catch (error) { res.status(400).json({ success: false, message: error.message }); }
};


module.exports = {
    createVoting,
    getVotings,
    getVotingById,
    addOption,
    getOptions,
    addEligibleVoter,
    getEligibleVoters,
    getVotingAccounts,
    issueBallot,
    openVoting,
    castVote,
    closeVoting,
    countVotes,
    cancelVoting,
    createGovernanceRule,
    getGovernanceRules,
    updateGovernanceRule,
    configureVoting,
    approveVotingRules,
    revokeVotingRules,
    reviewCandidate,
    verifyVoterIdentity,
    requestVoteOtp,
    verifyVoteOtp,
    publishResults,
    exportReport,
    getAuditEvents,
    scheduleVoting
};

