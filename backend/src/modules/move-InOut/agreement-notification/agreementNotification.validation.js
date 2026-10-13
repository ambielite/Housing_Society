const validateNotification = (data) => {

    const errors = [];

    if (!data.societyId) {
        errors.push("societyId is required");
    }

    if (!data.agreementId) {
        errors.push("agreementId is required");
    }

    if (!data.recipient) {
        errors.push("recipient is required");
    }

    if (!data.channel) {
        errors.push("channel is required");
    }

    if (!data.message) {
        errors.push("message is required");
    }

    const channels = [
        "IN_APP",
        "EMAIL",
        "WHATSAPP",
        "SMS"
    ];

    if (
        data.channel &&
        !channels.includes(data.channel)
    ) {
        errors.push(
            "Invalid notification channel"
        );
    }

    return errors;
};


module.exports = {
    validateNotification
};