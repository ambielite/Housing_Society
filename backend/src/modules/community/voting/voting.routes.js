
const express = require("express");

const router = express.Router();

const controller =
    require("./voting.controller");


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

router.get(
    "/:id",
    controller.getVotingById
);


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


// ============================================================
// ELIGIBLE VOTERS
// ============================================================

router.post(
    "/:id/eligible-voters",
    controller.addEligibleVoter
);


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

