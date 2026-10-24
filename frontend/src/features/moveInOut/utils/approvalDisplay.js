const nameFrom = (record) => {
    if (!record) return "";
    const parts = [record.firstName || record.first_name, record.lastName || record.last_name].filter(Boolean);
    return record.fullName || record.full_name || record.name || parts.join(" ") || record.email || "";
};

export const approverName = (id, approvers, currentUser) => {
    if (!id) return null;
    const currentId = currentUser?.id || currentUser?.userId || currentUser?.user?.id;
    if (id === currentId) return nameFrom(currentUser) || "Current user";
    const approver = approvers.find((item) => item.id === id || item.userId === id);
    return nameFrom(approver) || "Approver name unavailable";
};

export const formatApprovalDateTime = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return `${new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata"
    }).format(date)} IST`;
};
