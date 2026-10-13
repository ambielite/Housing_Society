
// Development/mock SMS provider. Connect Twilio, MSG91, or another gateway
// here when outbound SMS delivery is configured.
const sendSMS = async (notification) => {
    if (!notification) throw new Error("Notification data is required");
    console.log("SMS NOTIFICATION", notification.userId, notification.message);
    return { success: true, channel: "SMS", provider: "MOCK_SMS", messageId: notification.id };
};


module.exports = {
    sendSMS
};

