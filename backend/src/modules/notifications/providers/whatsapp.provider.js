
// Development/mock WhatsApp provider. Connect Meta WhatsApp Cloud API or
// another approved WhatsApp Business provider for outbound delivery.
const sendWhatsApp = async (notification) => {
    if (!notification) throw new Error("Notification data is required");
    console.log("WHATSAPP NOTIFICATION", notification.userId, notification.message);
    return { success: true, channel: "WHATSAPP", provider: "MOCK_WHATSAPP", messageId: notification.id };
};


module.exports = {
    sendWhatsApp
};

