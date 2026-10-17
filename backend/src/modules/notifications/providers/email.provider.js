
const sendEmail = async (notification) => {
    if (!notification) throw new Error("Notification data is required");
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (apiKey && from) {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from, to: [notification.email], subject: notification.subject || notification.title || "Society notification", text: notification.message })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "Email delivery failed");
        return { success: true, channel: "EMAIL", provider: "RESEND", messageId: result.id };
    }
    if (process.env.NODE_ENV === "production") throw new Error("Voting OTP email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.");
    console.log("DEVELOPMENT EMAIL OTP", notification.email, notification.subject || notification.title || "Notification", notification.message);
    return { success: true, channel: "EMAIL", provider: "DEVELOPMENT_CONSOLE", messageId: notification.id };
};


module.exports = {
    sendEmail
};

