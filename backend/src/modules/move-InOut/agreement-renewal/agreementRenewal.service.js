const repository =
    require("./agreementRenewal.repository");

const Agreement =
    require("../agreement/agreement.model");


const createRenewal = async (data) => {

    const agreement =
        await Agreement.findByPk(
            data.agreementId
        );

    if (!agreement) {
        throw new Error(
            "Existing agreement not found"
        );
    }


    if (
        agreement.status !== "ACTIVE" &&
        agreement.status !== "EXPIRING_SOON" &&
        agreement.status !== "RENEWAL_INITIATED"
    ) {
        throw new Error(
            "Agreement is not eligible for renewal"
        );
    }


    if (
        data.proposedStartDate >=
        data.proposedExpiryDate
    ) {
        throw new Error(
            "Proposed expiry date must be after proposed start date"
        );
    }


    const existingRenewals =
        await repository.findByAgreement(
            data.agreementId
        );


    const activeRenewal =
        existingRenewals.find(
            (renewal) =>
                renewal.status !== "REJECTED" &&
                renewal.status !== "COMPLETED"
        );


    if (activeRenewal) {
        throw new Error(
            "An active renewal application already exists"
        );
    }


    const renewal =
        await repository.create({

            agreementId:
                agreement.id,

            existingAgreementReference:
                agreement.agreementReference,

            currentExpiryDate:
                agreement.expiryDate,

            proposedStartDate:
                data.proposedStartDate,

            proposedExpiryDate:
                data.proposedExpiryDate,

            updatedAgreementDetails:
                data.updatedAgreementDetails || null,

            updatedDocuments:
                data.updatedDocuments || null,

            renewalAgreementCopy:
                data.renewalAgreementCopy || null,

            requestedBy:
                data.requestedBy || null,

            remarks:
                data.remarks || null,

            status: "DRAFT"
        });


    return renewal;
};


const getRenewals = async () => {
    return await repository.findAll();
};


const getRenewal = async (id) => {

    const renewal =
        await repository.findById(id);

    if (!renewal) {
        throw new Error(
            "Renewal application not found"
        );
    }

    return renewal;
};


const getRenewalsByAgreement = async (
    agreementId
) => {

    return await repository.findByAgreement(
        agreementId
    );
};


const getPendingRenewals = async () => {
    return await repository.findPending();
};


const submitRenewal = async (id) => {

    const renewal =
        await repository.findById(id);

    if (!renewal) {
        throw new Error(
            "Renewal application not found"
        );
    }


    if (
        renewal.status !== "DRAFT" &&
        renewal.status !== "ADDITIONAL_INFO_REQUIRED"
    ) {
        throw new Error(
            "Renewal cannot be submitted in its current status"
        );
    }


    return await repository.update(id, {
        status: "SUBMITTED",
        applicationDate:
            renewal.applicationDate || new Date()
    });
};


const startReview = async (id) => {

    const renewal =
        await repository.findById(id);

    if (!renewal) {
        throw new Error(
            "Renewal application not found"
        );
    }


    if (renewal.status !== "SUBMITTED") {
        throw new Error(
            "Only submitted renewals can enter review"
        );
    }


    return await repository.update(id, {
        status: "UNDER_REVIEW"
    });
};


const requestAdditionalInformation = async (
    id,
    remarks
) => {

    const renewal =
        await repository.findById(id);

    if (!renewal) {
        throw new Error(
            "Renewal application not found"
        );
    }


    if (
        renewal.status !== "SUBMITTED" &&
        renewal.status !== "UNDER_REVIEW"
    ) {
        throw new Error(
            "Additional information cannot be requested in the current status"
        );
    }


    if (!remarks) {
        throw new Error(
            "Remarks are required"
        );
    }


    return await repository.update(id, {

        status:
            "ADDITIONAL_INFO_REQUIRED",

        remarks
    });
};


const approveRenewal = async (
    id,
    approvedBy,
    remarks
) => {

    const renewal =
        await repository.findById(id);

    if (!renewal) {
        throw new Error(
            "Renewal application not found"
        );
    }


    if (renewal.status !== "UNDER_REVIEW") {
        throw new Error(
            "Only renewals under review can be approved"
        );
    }


    return await repository.update(id, {

        status: "APPROVED",

        approvedBy:
            approvedBy || null,

        approvalDate:
            new Date(),

        remarks:
            remarks || renewal.remarks
    });
};


const rejectRenewal = async (
    id,
    remarks
) => {

    const renewal =
        await repository.findById(id);

    if (!renewal) {
        throw new Error(
            "Renewal application not found"
        );
    }


    if (
        renewal.status !== "SUBMITTED" &&
        renewal.status !== "UNDER_REVIEW"
    ) {
        throw new Error(
            "Renewal cannot be rejected in the current status"
        );
    }


    if (!remarks) {
        throw new Error(
            "Remarks are required when rejecting renewal"
        );
    }


    return await repository.update(id, {

        status: "REJECTED",

        remarks
    });
};


const completeRenewal = async (id) => {

    const renewal =
        await repository.findById(id);

    if (!renewal) {
        throw new Error(
            "Renewal application not found"
        );
    }


    if (renewal.status !== "APPROVED") {
        throw new Error(
            "Only approved renewals can be completed"
        );
    }


    const agreement =
        await Agreement.findByPk(
            renewal.agreementId
        );

    if (!agreement) {
        throw new Error(
            "Original agreement not found"
        );
    }


    /*
     * The original agreement is retained
     * for historical purposes.
     *
     * We update its renewal information
     * and mark the renewal as completed.
     */

    await agreement.update({

        status: "RENEWED",

        renewalStatus: "RENEWED",

        renewalApplicationDate:
            renewal.applicationDate,

        renewalApprovalDate:
            renewal.approvalDate,

        renewalAgreementDocument:
            renewal.renewalAgreementCopy
    });


    return await repository.update(id, {

        status: "COMPLETED"
    });
};


const updateRenewal = async (
    id,
    data
) => {

    const renewal =
        await repository.findById(id);

    if (!renewal) {
        throw new Error(
            "Renewal application not found"
        );
    }


    if (
        data.proposedStartDate &&
        data.proposedExpiryDate &&
        data.proposedStartDate >=
        data.proposedExpiryDate
    ) {
        throw new Error(
            "Proposed expiry date must be after proposed start date"
        );
    }


    return await repository.update(
        id,
        data
    );
};


const deleteRenewal = async (id) => {

    const renewal =
        await repository.deleteById(id);

    if (!renewal) {
        throw new Error(
            "Renewal application not found"
        );
    }

    return renewal;
};


module.exports = {

    createRenewal,

    getRenewals,

    getRenewal,

    getRenewalsByAgreement,

    getPendingRenewals,

    submitRenewal,

    startReview,

    requestAdditionalInformation,

    approveRenewal,

    rejectRenewal,

    completeRenewal,

    updateRenewal,

    deleteRenewal
};