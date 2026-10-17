const repository = require("./residentVerification.repository");
const Resident = require("../resident/resident.model");
const usersRepository = require("../../users/users.repository");

const addReviewerNames = async (verifications) => {
    const rows = verifications.map((verification) =>
        typeof verification.toJSON === "function" ? verification.toJSON() : verification
    );
    const reviewerIds = [...new Set(rows.map((row) => row.reviewedBy).filter(Boolean))];
    const reviewers = await usersRepository.findNamesByIds(reviewerIds);
    const namesById = new Map(reviewers.map((reviewer) => [
        reviewer.id,
        [reviewer.first_name, reviewer.last_name].filter(Boolean).join(" ")
    ]));

    return rows.map((row) => ({
        ...row,
        reviewerName: row.reviewedBy ? namesById.get(row.reviewedBy) || null : null
    }));
};

const createVerification = async (data) => {
    const resident = await Resident.findByPk(data.residentId);

    if (!resident) {
        throw new Error("Resident not found");
    }

    if (resident.societyId !== data.societyId) {
        throw new Error(
            "Resident does not belong to the specified society"
        );
    }

    const verification = await repository.create({
        societyId: data.societyId,
        residentId: data.residentId,
        verificationType:
            data.verificationType || "INITIAL_REGISTRATION",
        status: "PENDING",
        submittedDocuments: data.submittedDocuments || [],
        metadata: data.metadata || {}
    });

    // Keep resident in pending state until verification is approved.
    if (resident.status !== "ACTIVE") {
        await resident.update({
            status: "PENDING",
            verificationStatus: "PENDING"
        });
    }

    return verification;
};

const getVerification = async (id) => {
    const verification = await repository.findById(id);

    if (!verification) {
        throw new Error("Verification request not found");
    }

    return verification;
};

const getAll = async (filters = {}) => {
    return await addReviewerNames(await repository.findAll(filters));
};

const getPendingQueue = async (societyId) => {
    return await addReviewerNames(await repository.findPending(societyId));
};

const getResidentVerifications = async (residentId) => {
    const resident = await Resident.findByPk(residentId);

    if (!resident) {
        throw new Error("Resident not found");
    }

    return await addReviewerNames(await repository.findByResident(residentId));
};

const approveVerification = async (
    id,
    reviewedBy,
    reviewerRemarks
) => {
    const verification = await repository.findById(id);

    if (!verification) {
        throw new Error("Verification request not found");
    }

    if (verification.status === "APPROVED") {
        throw new Error("Verification is already approved");
    }

    if (verification.status === "REJECTED") {
        throw new Error(
            "Rejected verification cannot be approved directly"
        );
    }

    const resident = await Resident.findByPk(
        verification.residentId
    );

    if (!resident) {
        throw new Error("Resident not found");
    }

    await verification.update({
        status: "APPROVED",
        reviewedBy,
        reviewedAt: new Date(),
        reviewerRemarks: reviewerRemarks || null,
        rejectionReason: null,
        informationRequest: null
    });

    await resident.update({
        status: "ACTIVE",
        verificationStatus: "APPROVED"
    });

    return verification;
};

const rejectVerification = async (
    id,
    reviewedBy,
    rejectionReason,
    reviewerRemarks
) => {
    const verification = await repository.findById(id);

    if (!verification) {
        throw new Error("Verification request not found");
    }

    const resident = await Resident.findByPk(
        verification.residentId
    );

    if (!resident) {
        throw new Error("Resident not found");
    }

    await verification.update({
        status: "REJECTED",
        reviewedBy,
        reviewedAt: new Date(),
        rejectionReason,
        reviewerRemarks: reviewerRemarks || null
    });

    await resident.update({
        status: "PENDING",
        verificationStatus: "REJECTED"
    });

    return verification;
};

const requestMoreInformation = async (
    id,
    reviewedBy,
    informationRequest,
    reviewerRemarks
) => {
    const verification = await repository.findById(id);

    if (!verification) {
        throw new Error("Verification request not found");
    }

    const resident = await Resident.findByPk(
        verification.residentId
    );

    if (!resident) {
        throw new Error("Resident not found");
    }

    await verification.update({
        status: "MORE_INFORMATION_REQUIRED",
        reviewedBy,
        reviewedAt: new Date(),
        informationRequest,
        reviewerRemarks: reviewerRemarks || null
    });

    await resident.update({
        status: "PENDING",
        verificationStatus: "MORE_INFORMATION_REQUIRED"
    });

    return verification;
};

const updateStakeholderStatus = async (
    residentId,
    status,
    remarks
) => {
    const resident = await Resident.findByPk(residentId);

    if (!resident) {
        throw new Error("Resident not found");
    }

    await resident.update({
        status,
        remarks: remarks || resident.remarks
    });

    return resident;
};

const deleteVerification = async (id) => {
    const verification = await repository.findById(id);

    if (!verification) {
        throw new Error("Verification request not found");
    }

    await repository.remove(id);

    return verification;
};

module.exports = {
    createVerification,
    getVerification,
    getAll,
    getPendingQueue,
    getResidentVerifications,
    approveVerification,
    rejectVerification,
    requestMoreInformation,
    updateStakeholderStatus,
    deleteVerification
};
