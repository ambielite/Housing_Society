
// Development/mock email provider. Connect SMTP, Resend, SES, or another
// provider here when outbound email delivery is configured.
const sendEmail = async (notification) => {
    if (!notification) throw new Error("Notification data is required");
    console.log("EMAIL NOTIFICATION", notification.userId, notification.subject || notification.title || "Notification", notification.message);
    return { success: true, channel: "EMAIL", provider: "MOCK_EMAIL", messageId: notification.id };
};


module.exports = {
    sendEmail
};

