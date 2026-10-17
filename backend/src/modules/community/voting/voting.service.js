
const crypto = require("crypto");
const usersRepository = require("../../users/users.repository");
const emailProvider = require("../../notifications/providers/email.provider");
const Resident = require("../../residents/resident/resident.model");
const { Op } = require("sequelize");

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
const assertElectronicVotingEnabled = (voting) => {
    if (process.env.COMMUNITY_E_VOTING_DISABLED === "true") throw new Error("Electronic voting is disabled by the system administrator");
    if (!voting?.rulesApproved || !voting.legalBasis || !voting.rulesApprovedBy || !voting.rulesApprovedAt) {
        throw new Error("Voting cannot proceed until this election's legal basis and configured rules are reviewed and approved");
    }
};

const recordAudit = async (voting, actorId, action, details = {}) => repository.appendAudit({
    votingId: voting.id, societyId: voting.societyId, actorId, action, details
});

const validateVotingWindow = (voting) => {
    const startAt = voting.startAt ? new Date(voting.startAt).getTime() : NaN;
    const endAt = voting.endAt ? new Date(voting.endAt).getTime() : NaN;
    if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt <= startAt) {
        throw new Error("Configure a valid ballot opening and closing time before approving the voting rules");
    }
    const rules = voting.eligibilityRules || {};
    if (rules.noticeDate && Number.isFinite(Number(rules.noticePeriodDays))) {
        const noticeAt = new Date(rules.noticeDate).getTime();
        if (startAt < noticeAt + Number(rules.noticePeriodDays) * 86400000) throw new Error("The voting window does not meet the configured notice period");
    }
};

const approveRules = async (id, actorId) => {
    const voting = await repository.findVotingById(id);
    if (!voting) throw new Error("Voting event not found");
    if (voting.status !== "DRAFT") throw new Error("Rules can only be approved while the vote is a draft");
    if (!actorId || !String(voting.legalBasis || "").trim()) throw new Error("Record the applicable law/bylaw reference and signed-in approver before approving the rules");
    if (!voting.eligibilityRules || typeof voting.eligibilityRules !== "object" || Array.isArray(voting.eligibilityRules)) throw new Error("Eligibility rules must be a JSON object");
    validateVotingWindow(voting);
    const updated = await repository.updateVoting(voting, { rulesApproved: true, rulesApprovedBy: actorId, rulesApprovedAt: new Date() });
    await recordAudit(updated, actorId, "RULES_APPROVED", { legalBasis: updated.legalBasis, eligibilityRules: updated.eligibilityRules });
    return updated;
};

const revokeRulesApproval = async (id, actorId) => {
    const voting = await repository.findVotingById(id);
    if (!voting) throw new Error("Voting event not found");
    if (voting.status !== "DRAFT") throw new Error("Rules approval cannot be changed after voting starts");
    const updated = await repository.updateVoting(voting, { rulesApproved: false, rulesApprovedBy: null, rulesApprovedAt: null });
    await recordAudit(updated, actorId, "RULES_APPROVAL_REVOKED");
    return updated;
};

const updateVotingConfiguration = async (id, data, actorId) => {
    const voting = await repository.findVotingById(id);
    if (!voting) throw new Error("Voting event not found");
    if (voting.status !== "DRAFT") throw new Error("Voting configuration can only be changed while the record is a draft");
    const allowed = ["title", "description", "votingType", "ballotType", "secrecy", "startAt", "endAt", "quorumRequired", "eligibilityRules", "legalBasis", "candidateApprovalRequired", "identityVerificationRequired", "otpRequired"];
    const changes = Object.fromEntries(allowed.filter((key) => data[key] !== undefined).map((key) => [key, data[key]]));
    if (changes.eligibilityRules && (typeof changes.eligibilityRules !== "object" || Array.isArray(changes.eligibilityRules))) throw new Error("Eligibility rules must be a JSON object");
    if (changes.eligibilityRules) {
        const rules = changes.eligibilityRules;
        const validMemberTypes = ["OWNER", "CO_OWNER", "TENANT", "FAMILY_MEMBER", "PROPERTY_MANAGER"];
        if (rules.allowedMemberTypes !== undefined && (!Array.isArray(rules.allowedMemberTypes) || rules.allowedMemberTypes.some((type) => !validMemberTypes.includes(String(type).toUpperCase())))) throw new Error("Allowed member types must be a list of supported membership types");
        if (rules.minimumEligibleVoters !== undefined && (!Number.isInteger(Number(rules.minimumEligibleVoters)) || Number(rules.minimumEligibleVoters) < 1)) throw new Error("Minimum eligible voters must be a positive whole number");
        if (rules.noticePeriodDays !== undefined && (!Number.isInteger(Number(rules.noticePeriodDays)) || Number(rules.noticePeriodDays) < 0)) throw new Error("Notice period must be a non-negative whole number of days");
        if (rules.excludeTenants !== undefined && typeof rules.excludeTenants !== "boolean") throw new Error("Tenant exclusion must be true or false");
    }
    for (const field of ["startAt", "endAt"]) {
        if (changes[field] && Number.isNaN(new Date(changes[field]).getTime())) throw new Error(`${field} must be a valid date and time`);
    }
    const startAt = changes.startAt ?? voting.startAt;
    const endAt = changes.endAt ?? voting.endAt;
    if (startAt && endAt && new Date(endAt) <= new Date(startAt)) throw new Error("Ballot closing time must be after opening time");
    const updated = await repository.updateVoting(voting, { ...changes, otpRequired: true, candidateApprovalRequired: voting.votingType === "ELECTION" || changes.candidateApprovalRequired !== false, rulesApproved: false, rulesApprovedBy: null, rulesApprovedAt: null });
    await recordAudit(updated, actorId, "VOTING_CONFIGURATION_UPDATED", { changedFields: Object.keys(changes) });
    return updated;
};

const getAuditEvents = async (id) => {
    if (!await repository.findVotingById(id)) throw new Error("Voting event not found");
    return repository.findAudits(id);
};

const publishResults = async (id, actorId) => {
    const voting = await repository.findVotingById(id);
    if (!voting) throw new Error("Voting event not found");
    if (voting.status !== "RESULT_DECLARED" || !voting.resultData) throw new Error("Count the votes before publishing results");
    if (voting.resultsPublishedAt) throw new Error("Results have already been published");
    const updated = await repository.updateVoting(voting, { resultsPublishedAt: new Date() });
    await recordAudit(updated, actorId, "RESULTS_PUBLISHED", { resultDeclaredAt: voting.resultDeclaredAt });
    return updated;
};

const exportReport = async (id) => {
    const voting = await repository.findVotingById(id);
    if (!voting) throw new Error("Voting event not found");
    if (!voting.resultsPublishedAt || !voting.resultData) throw new Error("Publish election results before exporting the report");
    const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const lines = [["Election report", voting.title], ["Type", voting.votingType], ["Status", voting.status], ["Opened at", voting.startAt], ["Closed at", voting.endAt], ["Published at", voting.resultsPublishedAt], ["Legal basis", voting.legalBasis], ["Total votes", voting.resultData.totalVotes], ["Quorum reached", voting.resultData.quorumReached], [], ["Option / Candidate", "Votes"]];
    for (const option of voting.resultData.options || []) lines.push([option.optionLabel, option.voteCount]);
    return lines.map((line) => line.map(csvCell).join(",")).join("\r\n");
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

    const voting = await repository.createVoting({ ...data, otpRequired: true, candidateApprovalRequired: data.votingType === "ELECTION" || data.candidateApprovalRequired !== false, status: "DRAFT", rulesApproved: false, rulesApprovedBy: null, rulesApprovedAt: null, resultsPublishedAt: null });
    await recordAudit(voting, data.createdBy, "VOTING_CREATED", { votingType: voting.votingType, ballotType: voting.ballotType });
    return voting;
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

    const records = await repository.findVotings(where);
    return records.map((record) => {
        if (!record.resultsPublishedAt) record.setDataValue("resultData", null);
        return record;
    });
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

    if (!voting.resultsPublishedAt) voting.setDataValue("resultData", null);
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

    const isCandidate = voting.votingType === "ELECTION";
    if (voting.votingType === "ELECTION") {
        if (!data.candidateUserId) throw new Error("Candidate account ID is required for election registration");
        const candidateUser = await usersRepository.findById(data.candidateUserId);
        if (!candidateUser || candidateUser.society_id !== voting.societyId || candidateUser.status !== "ACTIVE") throw new Error("Candidate must be an active account in this society");
        const resident = await Resident.findOne({ where: { societyId: voting.societyId, email: { [Op.iLike]: candidateUser.email }, status: "ACTIVE" } });
        if (!resident || !["PRIMARY_OWNER", "CO_OWNER"].includes(resident.role)) throw new Error("Election candidates must be active owners or co-owners recorded as residents");
    }
    const candidateStatus = voting.votingType === "ELECTION" || (isCandidate && voting.candidateApprovalRequired) ? "PENDING" : "APPROVED";
    const option = await repository.createOption({
        ...data,
        // Polls and resolutions have options, not candidate accounts. The
        // shared frontend form may send an empty string for this UUID field.
        candidateUserId: isCandidate ? data.candidateUserId : null,
        candidateStatus,
        isActive: isCandidate ? candidateStatus === "APPROVED" : data.isActive !== false
    });
    await recordAudit(voting, data.createdBy, isCandidate ? "CANDIDATE_REGISTERED" : "OPTION_CREATED", { optionId: option.id, candidateUserId: option.candidateUserId, candidateStatus });
    return option;
};

const reviewCandidate = async (votingId, optionId, { approved, reason, actorId }) => {
    const voting = await repository.findVotingById(votingId);
    if (!voting) throw new Error("Voting event not found");
    if (voting.votingType !== "ELECTION" || voting.status !== "DRAFT") throw new Error("Candidates can only be reviewed for draft elections");
    const option = await repository.findOptionById(optionId);
    if (!option || option.votingId !== voting.id) throw new Error("Candidate not found for this election");
    if (approved !== true && !String(reason || "").trim()) throw new Error("Provide a reason when rejecting a candidate");
    const status = approved ? "APPROVED" : "REJECTED";
    await option.update({ candidateStatus: status, isActive: Boolean(approved), candidateReviewedBy: actorId, candidateReviewedAt: new Date(), candidateRejectionReason: approved ? null : reason.trim() });
    await recordAudit(voting, actorId, approved ? "CANDIDATE_APPROVED" : "CANDIDATE_REJECTED", { optionId, candidateUserId: option.candidateUserId, reason: approved ? null : reason.trim() });
    return option;
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

const addEligibleVoter = async (data, actorId) => {

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

    const memberType = String(data.memberType || "OWNER").toUpperCase();
    const eligibleTypes = (voting.eligibilityRules?.allowedMemberTypes || ["OWNER", "CO_OWNER", "TENANT"]).map((type) => String(type).toUpperCase());
    if (voting.eligibilityRules?.excludeTenants && memberType === "TENANT") throw new Error("Tenants are excluded by this election's configured eligibility rules");
    if (!eligibleTypes.includes(memberType)) throw new Error("This member type is not permitted by the configured eligibility rules");
    const voterAccount = await usersRepository.findById(data.userId);
    if (!voterAccount || voterAccount.society_id !== voting.societyId || voterAccount.status !== "ACTIVE") throw new Error("Eligible voters must have an active account in this society");
    const resident = await Resident.findOne({ where: { societyId: voting.societyId, email: { [Op.iLike]: voterAccount.email }, status: "ACTIVE" } });
    if (!resident) throw new Error("The account must be linked to an active resident record before being made eligible");
    const memberRole = resident.role === "PRIMARY_OWNER" ? "OWNER" : resident.role;
    if (memberRole !== memberType) throw new Error(`Resident records identify this voter as ${memberRole}; use that membership type`);

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
        memberType,
        eligibilityStatus:
            data.eligibilityStatus ||
            "ELIGIBLE"
    }).then(async (eligibility) => {
        const eligibleVoterCount = await repository.findEligibilities({ votingId: voting.id, eligibilityStatus: "ELIGIBLE" });
        await repository.updateVoting(voting, { eligibleVoterCount: eligibleVoterCount.length });
        await recordAudit(voting, actorId, "VOTER_ELIGIBILITY_ADDED", { eligibilityId: eligibility.id, memberType, eligibilityStatus: eligibility.eligibilityStatus });
        return eligibility;
    });
};

const getEligibleVoters = async (votingId) => {
    if (!await repository.findVotingById(votingId)) throw new Error("Voting event not found");
    return repository.findEligibilities({ votingId });
};

const getVotingAccounts = async (votingId) => {
    const voting = await repository.findVotingById(votingId);
    if (!voting) throw new Error("Voting event not found");
    const residents = await Resident.findAll({
        where: { societyId: voting.societyId, status: "ACTIVE" },
        attributes: ["email", "role", "displayName", "firstName", "lastName"]
    });
    const residentByEmail = new Map(residents.filter((resident) => resident.email).map((resident) => [resident.email.toLowerCase(), resident]));
    if (!residentByEmail.size) return [];
    const { rows } = await usersRepository.listUsers({ societyId: voting.societyId, status: "ACTIVE", limit: 500, offset: 0 });
    return rows.filter((account) => account.email && residentByEmail.has(account.email.toLowerCase())).map((account) => {
        const resident = residentByEmail.get(account.email.toLowerCase());
        return {
            id: account.id,
            email: account.email,
            first_name: account.first_name,
            last_name: account.last_name,
            displayName: resident.displayName || [resident.firstName, resident.lastName].filter(Boolean).join(" "),
            memberType: resident.role === "PRIMARY_OWNER" ? "OWNER" : resident.role
        };
    });
};


// ============================================================
// ISSUE BALLOT
// ============================================================

const issueBallot = async (
    votingId,
    eligibilityId
) => {
    throw new Error("Direct ballot issuance is disabled. The voter must complete OTP verification to receive a ballot token.");
};

const requestVoteOtp = async (votingId, userId) => {
    const voting = await repository.findVotingById(votingId);
    if (!voting) throw new Error("Voting event not found");
    assertElectronicVotingEnabled(voting);
    if (voting.status !== "OPEN") throw new Error("Voting is not currently open");
    const eligibility = await repository.findEligibility({ votingId, userId, eligibilityStatus: "ELIGIBLE" });
    if (!eligibility) throw new Error("You are not eligible to vote in this election");
    if (voting.identityVerificationRequired && !eligibility.identityVerified) throw new Error("Your identity must be verified before requesting a ballot");
    if (voting.eligibilityRules?.excludeTenants && String(eligibility.memberType).toUpperCase() === "TENANT") throw new Error("Tenants are excluded from this vote");
    if (eligibility.hasVoted) throw new Error("A vote has already been submitted for this eligibility record");
    const user = await usersRepository.findById(userId);
    if (!user?.email) throw new Error("A verified account email is required to receive a voting OTP");
    const existingBallot = await repository.findBallot({ votingId, eligibilityId: eligibility.id });
    if (existingBallot) throw new Error("A ballot has already been issued for your eligibility record");
    const latest = await repository.findLatestOtp({ votingId, eligibilityId: eligibility.id });
    if (latest && Date.now() - new Date(latest.createdAt).getTime() < 60000) throw new Error("Wait one minute before requesting another OTP");
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    await repository.createOtp({ votingId, eligibilityId: eligibility.id, codeHash: hashToken(code), expiresAt: new Date(Date.now() + 5 * 60000) });
    await emailProvider.sendEmail({ email: user.email, userId, subject: "Your society voting verification code", title: "Voting OTP", message: `Your one-time voting code is ${code}. It expires in five minutes.` });
    await recordAudit(voting, userId, "VOTER_OTP_SENT", { eligibilityId: eligibility.id });
    return { message: "A verification code was sent to your registered email address.", expiresInSeconds: 300 };
};

const verifyVoteOtp = async (votingId, userId, code) => {
    const voting = await repository.findVotingById(votingId);
    if (!voting) throw new Error("Voting event not found");
    assertElectronicVotingEnabled(voting);
    if (voting.status !== "OPEN") throw new Error("Voting is not currently open");
    const eligibility = await repository.findEligibility({ votingId, userId, eligibilityStatus: "ELIGIBLE" });
    if (!eligibility) throw new Error("You are not eligible to vote in this election");
    const otp = await repository.findLatestOtp({ votingId, eligibilityId: eligibility.id });
    if (!otp || otp.usedAt || otp.verifiedAt || new Date(otp.expiresAt) <= new Date()) throw new Error("The code is missing, expired, or already used. Request a new code.");
    if (otp.attempts >= 5) throw new Error("Too many incorrect code attempts. Request a new code.");
    if (hashToken(String(code || "")) !== otp.codeHash) {
        await repository.updateOtp(otp, { attempts: otp.attempts + 1 });
        throw new Error("The verification code is incorrect");
    }
    const rawToken = crypto.randomBytes(32).toString("hex");
    const ballot = await repository.issueBallotAfterOtp({ otp, codeHash: otp.codeHash, votingId, eligibilityId: eligibility.id, ballotTokenHash: hashToken(rawToken) });
    await recordAudit(voting, userId, "BALLOT_ISSUED_AFTER_OTP", { ballotId: ballot.id });
    return { ballotToken: rawToken, options: await repository.findOptions({ votingId, isActive: true, candidateStatus: "APPROVED" }) };
};

const verifyVoterIdentity = async (votingId, eligibilityId, verified, actorId) => {
    const voting = await repository.findVotingById(votingId);
    if (!voting) throw new Error("Voting event not found");
    if (voting.status !== "DRAFT" && voting.status !== "SCHEDULED") throw new Error("Identity checks cannot be changed after voting opens");
    const eligibility = await repository.findEligibility({ id: eligibilityId, votingId });
    if (!eligibility) throw new Error("Eligible voter not found");
    await eligibility.update({ identityVerified: Boolean(verified), identityVerifiedBy: verified ? actorId : null, identityVerifiedAt: verified ? new Date() : null });
    await recordAudit(voting, actorId, verified ? "VOTER_IDENTITY_VERIFIED" : "VOTER_IDENTITY_UNVERIFIED", { eligibilityId });
    return eligibility;
};


// ============================================================
// OPEN VOTING
// ============================================================

const openVoting = async (id, actorId) => {
    const voting =
        await repository.findVotingById(id);

    if (!voting) {
        throw new Error(
            "Voting event not found"
        );
    }

    assertElectronicVotingEnabled(voting);
    validateVotingWindow(voting);
    if (new Date(voting.startAt) > new Date()) throw new Error("The configured voting opening time has not arrived");

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

    if (voting.votingType === "ELECTION" && options.some((option) => option.candidateStatus !== "APPROVED")) {
        throw new Error("All election candidates must be approved before voting opens");
    }
    if (eligible.length < Number(voting.eligibilityRules?.minimumEligibleVoters || 0)) throw new Error("Eligible voter count is below the configured minimum");
    if (voting.identityVerificationRequired && eligible.some((record) => !record.identityVerified)) throw new Error("Verify every eligible voter's identity before opening this election");
    if (voting.eligibilityRules?.excludeTenants && eligible.some((record) => String(record.memberType).toUpperCase() === "TENANT")) throw new Error("Remove tenant eligibility records before opening this election");

    const updated = await repository.updateVoting(
        voting,
        {
            status: "OPEN",
            eligibleVoterCount:
                eligible.length
        }
    );
    await recordAudit(updated, actorId, "BALLOT_OPENED", { eligibleVoterCount: eligible.length });
    return updated;
};

const scheduleVoting = async (id, actorId) => {
    const voting = await repository.findVotingById(id);
    if (!voting) throw new Error("Voting event not found");
    if (voting.status !== "DRAFT") throw new Error("Only draft voting can be scheduled");
    assertElectronicVotingEnabled(voting);
    validateVotingWindow(voting);
    if (new Date(voting.startAt) <= new Date()) throw new Error("The configured opening time has passed; open the ballot directly");
    const updated = await repository.updateVoting(voting, { status: "SCHEDULED" });
    await recordAudit(updated, actorId, "BALLOT_SCHEDULED", { startAt: voting.startAt, endAt: voting.endAt });
    return updated;
};

const processVotingWindows = async () => {
    const due = await repository.findVotings({ status: "SCHEDULED" });
    for (const voting of due) {
        if (new Date(voting.startAt) > new Date()) continue;
        if (new Date(voting.endAt) <= new Date()) {
            const closed = await repository.updateVoting(voting, { status: "CLOSED" });
            await recordAudit(closed, null, "BALLOT_WINDOW_MISSED", { startAt: voting.startAt, endAt: voting.endAt });
        } else {
            try { await openVoting(voting.id, null); }
            catch (error) { await recordAudit(voting, null, "BALLOT_AUTO_OPEN_FAILED", { message: error.message }); }
        }
    }
    const open = await repository.findVotings({ status: "OPEN" });
    for (const voting of open) {
        if (voting.endAt && new Date(voting.endAt) <= new Date()) await closeVoting(voting.id, null);
    }
};


// ============================================================
// CAST VOTE
// ============================================================

const castVote = async (data) => {
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

    assertElectronicVotingEnabled(voting);

    if (voting.status !== "OPEN") {
        throw new Error(
            "Voting is not currently open"
        );
    }

    if (!voting.startAt || new Date() < new Date(voting.startAt)) throw new Error("Voting has not opened yet");
    if (!voting.endAt || new Date() >= new Date(voting.endAt)) {
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

    if (voting.votingType === "ELECTION" && option.candidateStatus !== "APPROVED") throw new Error("This candidate is not approved for this election");

    const eligibility =
        await repository.findEligibility({
            id: ballot.eligibilityId
        });

    if (!eligibility || eligibility.eligibilityStatus !== "ELIGIBLE") throw new Error("Voter eligibility is no longer active");
    const receipt = crypto.randomBytes(32).toString("hex");
    await repository.castVoteAtomically({ ballot, eligibility, vote: { votingId: voting.id, optionId: option.id, receiptHash: hashToken(receipt) } });
    await recordAudit(voting, null, "VOTE_CAST", { receiptHash: hashToken(receipt) });

    return {
        success: true,
        message: "Vote cast successfully"
    };
};


// ============================================================
// CLOSE VOTING
// ============================================================

const closeVoting = async (id, actorId) => {
    const voting =
        await repository.findVotingById(id);

    if (!voting) {
        throw new Error(
            "Voting event not found"
        );
    }

    assertElectronicVotingEnabled(voting);

    if (voting.status !== "OPEN") {
        throw new Error(
            "Only open voting can be closed"
        );
    }

    const updated = await repository.updateVoting(
        voting,
        {
            status: "CLOSED",
            endAt: voting.endAt || new Date()
        }
    );
    await recordAudit(updated, actorId, "BALLOT_CLOSED");
    return updated;
};


// ============================================================
// COUNT VOTES
// ============================================================

const countVotes = async (id, actorId) => {
    const voting =
        await repository.findVotingById(id);

    if (!voting) {
        throw new Error(
            "Voting event not found"
        );
    }

    assertElectronicVotingEnabled(voting);

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

    const result = await repository.updateVoting(
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
    await recordAudit(result, actorId, "RESULTS_COUNTED", { totalVotes, quorumReached });
    return result;
};


// ============================================================
// CANCEL
// ============================================================

const cancelVoting = async (
    id,
    reason,
    actorId
) => {

    const voting =
        await repository.findVotingById(id);

    if (!voting) {
        throw new Error(
            "Voting event not found"
        );
    }

    if (!String(reason || "").trim()) throw new Error("Cancellation reason is required");

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

    const updated = await repository.updateVoting(
        voting,
        {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancellationReason: reason.trim()
        }
    );
    await recordAudit(updated, actorId, "VOTING_CANCELLED", { reason: reason.trim() });
    return updated;
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
    getEligibleVoters,
    getVotingAccounts,
    issueBallot,
    openVoting,
    scheduleVoting,
    processVotingWindows,
    castVote,
    closeVoting,
    countVotes,
    cancelVoting,
    createGovernanceRule,
    getGovernanceRules,
    updateGovernanceRule,
    approveRules,
    revokeRulesApproval,
    updateVotingConfiguration,
    reviewCandidate,
    verifyVoterIdentity,
    requestVoteOtp,
    verifyVoteOtp,
    publishResults,
    exportReport,
    getAuditEvents
};

