const meetingRepository =
    require("./meeting.repository");

const repository =
    require("./meetingMinutes.repository");

const {
    validateMinutes
} = require("./meeting.validation");


const createMinutes = async (data) => {

    validateMinutes(data);

    const meeting =
        await meetingRepository.findById(
            data.meetingId
        );

    if (!meeting) {
        throw new Error("Meeting not found");
    }

    if (
        meeting.status !== "COMPLETED"
    ) {
        throw new Error(
            "Minutes can be created only after meeting completion"
        );
    }

    const existing =
        await repository.findOne({
            meetingId: data.meetingId
        });

    if (existing) {
        throw new Error(
            "Minutes already exist for this meeting"
        );
    }

    return await repository.create({
        ...data,
        status: "DRAFT"
    });
};


const getMinutes = async (meetingId) => {

    const minutes =
        await repository.findOne({
            meetingId
        });

    if (!minutes) {
        throw new Error(
            "Meeting minutes not found"
        );
    }

    return minutes;
};


const updateMinutes = async (
    id,
    data
) => {

    const minutes =
        await repository.findById(id);

    if (!minutes) {
        throw new Error(
            "Meeting minutes not found"
        );
    }

    if (
        minutes.status === "APPROVED"
    ) {
        throw new Error(
            "Approved minutes cannot be edited"
        );
    }

    return await repository.update(
        minutes,
        data
    );
};


const submitMinutes = async (id) => {

    const minutes =
        await repository.findById(id);

    if (!minutes) {
        throw new Error(
            "Meeting minutes not found"
        );
    }

    if (
        minutes.status !== "DRAFT" &&
        minutes.status !== "REJECTED"
    ) {
        throw new Error(
            "Only draft or rejected minutes can be submitted"
        );
    }

    return await repository.update(
        minutes,
        {
            status: "SUBMITTED"
        }
    );
};


const approveMinutes = async (
    id,
    data
) => {

    if (!data.approvedBy) {
        throw new Error(
            "approvedBy is required"
        );
    }

    const minutes =
        await repository.findById(id);

    if (!minutes) {
        throw new Error(
            "Meeting minutes not found"
        );
    }

    if (
        minutes.status !== "SUBMITTED"
    ) {
        throw new Error(
            "Only submitted minutes can be approved"
        );
    }

    return await repository.update(
        minutes,
        {
            status: "APPROVED",
            approvedBy: data.approvedBy,
            approvedAt: new Date(),
            approvalNote:
                data.approvalNote || null
        }
    );
};


const rejectMinutes = async (
    id,
    data
) => {

    if (!data.approvedBy) {
        throw new Error(
            "reviewer ID is required"
        );
    }

    if (!data.approvalNote) {
        throw new Error(
            "approvalNote is required"
        );
    }

    const minutes =
        await repository.findById(id);

    if (!minutes) {
        throw new Error(
            "Meeting minutes not found"
        );
    }

    if (
        minutes.status !== "SUBMITTED"
    ) {
        throw new Error(
            "Only submitted minutes can be rejected"
        );
    }

    return await repository.update(
        minutes,
        {
            status: "REJECTED",
            approvedBy: data.approvedBy,
            approvalNote:
                data.approvalNote
        }
    );
};


const deleteMinutes = async (id) => {

    const minutes =
        await repository.findById(id);

    if (!minutes) {
        throw new Error(
            "Meeting minutes not found"
        );
    }

    if (
        minutes.status === "APPROVED"
    ) {
        throw new Error(
            "Approved minutes cannot be deleted"
        );
    }

    return await repository.deleteMinutes(
        minutes
    );
};


module.exports = {
    createMinutes,
    getMinutes,
    updateMinutes,
    submitMinutes,
    approveMinutes,
    rejectMinutes,
    deleteMinutes
};