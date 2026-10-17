
const express = require("express");

const router = express.Router();

const controller =
    require("./voting.controller");
const CommunityVoting = require("./voting.model");

const enforceVotingSociety = async (req, res, next) => {
    try {
        // This middleware is mounted on /:id, so it also sees static routes
        // such as /rules and /cast. Only look up actual UUID record IDs.
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.params.id || "")) return next();
        const voting = await CommunityVoting.findByPk(req.params.id);
        if (!voting) return next();
        if (req.user?.roles?.includes("SUPER_ADMIN") || String(req.user?.societyId) === String(voting.societyId)) return next();
        return res.status(403).json({ success: false, message: "You do not have access to this society's voting records" });
    } catch (error) { return next(error); }
};


// ============================================================
// VOTING
// ============================================================

router.post(
    "/",
    controller.createVoting
);

router.get(
    "/",
    controller.getVotings
);

router.use("/:id", enforceVotingSociety);

router.get(
    "/:id",
    controller.getVotingById
);

router.put("/:id/configuration", controller.configureVoting);
router.post("/:id/approve-rules", controller.approveVotingRules);
router.post("/:id/revoke-rules-approval", controller.revokeVotingRules);
router.get("/:id/audit", controller.getAuditEvents);
router.get("/:id/report.csv", controller.exportReport);
router.post("/:id/publish-results", controller.publishResults);
router.post("/:id/schedule", controller.scheduleVoting);
router.post("/:id/otp/request", controller.requestVoteOtp);
router.post("/:id/otp/verify", controller.verifyVoteOtp);
router.post("/:id/eligibility/:eligibilityId/identity", controller.verifyVoterIdentity);


// ============================================================
// OPTIONS
// ============================================================

router.post(
    "/:id/options",
    controller.addOption
);

router.get(
    "/:id/options",
    controller.getOptions
);
router.post("/:id/candidates/:optionId/review", controller.reviewCandidate);


// ============================================================
// ELIGIBLE VOTERS
// ============================================================

router.post(
    "/:id/eligible-voters",
    controller.addEligibleVoter
);
router.get("/:id/eligible-voters", controller.getEligibleVoters);
router.get("/:id/voter-candidates", controller.getVotingAccounts);


// ============================================================
// BALLOT
// ============================================================

router.post(
    "/:id/issue-ballot",
    controller.issueBallot
);


// ============================================================
// VOTING LIFECYCLE
// ============================================================

router.post(
    "/:id/open",
    controller.openVoting
);

router.post(
    "/cast",
    controller.castVote
);

router.post(
    "/:id/close",
    controller.closeVoting
);

router.post(
    "/:id/count",
    controller.countVotes
);

router.post(
    "/:id/cancel",
    controller.cancelVoting
);


// ============================================================
// GOVERNANCE RULES
// ============================================================

router.post(
    "/rules",
    controller.createGovernanceRule
);

router.get(
    "/rules/society/:societyId",
    controller.getGovernanceRules
);

router.put(
    "/rules/:id",
    controller.updateGovernanceRule
);


module.exports = router;

