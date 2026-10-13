
const emailProvider = require("./email.provider");
const smsProvider = require("./sms.provider");
const whatsappProvider = require("./whatsapp.provider");


// ============================================================
// SEND NOTIFICATION
// ============================================================

const sendNotification = async (notification) => {

    if (!notification) {
        throw new Error(
            "Notification data is required"
        );
    }


    const channel =
        notification.channel;


    switch (channel) {

        case "IN_APP":

            return await sendInApp(
                notification
            );


        case "EMAIL":

            return await emailProvider.sendEmail(
                notification
            );


        case "SMS":

            return await smsProvider.sendSMS(
                notification
            );


        case "WHATSAPP":

            return await whatsappProvider.sendWhatsApp(
                notification
            );


        default:

            throw new Error(
                `Unsupported notification channel: ${channel}`
            );
    }
};


// ============================================================
// IN-APP NOTIFICATION
// ============================================================

const sendInApp = async (
    notification
) => {

    console.log(
        "======================================"
    );

    console.log(
        "IN-APP NOTIFICATION"
    );

    console.log(
        "User:",
        notification.userId
    );

    console.log(
        "Title:",
        notification.title
    );

    console.log(
        "Message:",
        notification.message
    );

    console.log(
        "======================================"
    );


    return {
        success: true,
        channel: "IN_APP",
        provider: "SYSTEM",
        messageId: notification.id
    };
};


module.exports = {
    sendNotification,
    sendInApp
};

