import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Activity, Bell, CheckCheck, ChevronRight, CircleAlert, FileText, Mail, Megaphone, MessageSquare, Plus, RefreshCw, Search, Settings2, Smartphone, Trash2 } from "lucide-react";
import axiosClient from "../../../lib/axios";
import { useAuth } from "../../../app/providers/useAuth";
import notificationsApi from "../api/notifications.api";

const channels = ["IN_APP", "EMAIL", "SMS", "WHATSAPP"];
const channelIcons = { IN_APP: Bell, EMAIL: Mail, SMS: Smartphone, WHATSAPP: MessageSquare };
const typeOptions = ["OPERATIONAL", "MARKETING", "EMERGENCY"];
const priorityOptions = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const statusOptions = ["PENDING", "PROCESSING", "SENT", "DELIVERED", "FAILED", "CANCELLED"];
const sections = [
    ["overview", "Overview", Activity], ["notifications", "Notifications", Bell], ["templates", "Templates", FileText],
    ["preferences", "Preferences", Settings2], ["broadcasts", "Broadcasts", Megaphone], ["reports", "Delivery reports", CheckCheck]
];
const rowList = (result) => {
    let list = Array.isArray(result) ? result : result?.data || result?.records || result?.items || [];
    if (!Array.isArray(list) && Array.isArray(list?.rows)) list = list.rows;
    return Array.isArray(list) ? list.filter((entry) => entry && typeof entry === "object") : [];
};
const societyId = () => String(localStorage.getItem("selectedSocietyId") || "").replace(/^:+/, "").trim();
const titleCase = (value) => String(value || "—").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const dateTime = (value) => value ? new Date(value).toLocaleString() : "—";
const userKey = (value) => value?.id || value?.userId || value?.user?.id || value?.data?.user?.id || "";
const errorText = (error) => error?.response?.data?.message || error?.message || "Request failed. Please try again.";

export default function NotificationsPage() {
    const { section } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const currentUserId = userKey(user);
    const active = section || "overview";
    const [data, setData] = useState({ notifications: [], templates: [], preferences: [], broadcasts: [], residents: [], towers: [] });
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ALL");
    const [form, setForm] = useState("");
    const [edit, setEdit] = useState(null);
    const [broadcastAudience, setBroadcastAudience] = useState("SOCIETY");

    const load = useCallback(async () => {
        setLoading(true); setError("");
        const requests = [
            ["notifications", () => notificationsApi.getNotifications()],
            ["templates", () => notificationsApi.getTemplates()],
            ["preferences", () => notificationsApi.getPreferences(currentUserId)],
            ["broadcasts", () => notificationsApi.getBroadcasts()],
            ["residents", () => axiosClient.get("/residents", { params: societyId() ? { societyId: societyId() } : {} })],
            ["towers", () => axiosClient.get("/towers", { params: societyId() ? { societyId: societyId() } : {} })]
        ];
        const settled = await Promise.allSettled(requests.map(([, request]) => request()));
        const next = {}; const failures = [];
        settled.forEach((result, index) => {
            const [key] = requests[index];
            if (result.status === "fulfilled") next[key] = rowList(result.value?.data ?? result.value);
            else { next[key] = []; failures.push(`${key}: ${errorText(result.reason)}`); }
        });
        const sid = societyId();
        next.templates = (next.templates || []).filter((item) => !item.societyId || !sid || String(item.societyId) === sid);
        setData(next);
        if (failures.length) setError(`Some notification data could not load: ${failures.join(" · ")}`);
        setLoading(false);
    }, [currentUserId]);

    useEffect(() => { load(); }, [load]);
    const setActive = useCallback((nextSection) => {
        if (nextSection !== active) navigate(`/notifications/${nextSection}`);
    }, [active, navigate]);
    useEffect(() => {
        if (!form) return undefined;
        const oldOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (event) => { if (event.key === "Escape") { setForm(""); setEdit(null); } };
        window.addEventListener("keydown", onKey);
        return () => { document.body.style.overflow = oldOverflow; window.removeEventListener("keydown", onKey); };
    }, [form]);

    const notifications = data.notifications || [];
    const templates = data.templates || [];
    const preferences = data.preferences || [];
    const broadcasts = data.broadcasts || [];
    const people = useMemo(() => {
        const recipients = (data.residents || []).map((person) => ({ id: person.userId || person.id, label: person.displayName || `${person.firstName || ""} ${person.lastName || ""}`.trim() || person.email || person.mobile || "Resident" }));
        if (currentUserId && !recipients.some((item) => String(item.id) === String(currentUserId))) recipients.unshift({ id: currentUserId, label: `${user?.name || user?.fullName || user?.email || "Signed-in user"} (you)` });
        return recipients.filter((item) => item.id);
    }, [data.residents, currentUserId, user]);
    const preferenceUserName = (userId) => {
        if (String(userId) === String(currentUserId)) return user?.displayName || user?.name || user?.fullName || user?.email || "You";
        const resident = (data.residents || []).find((person) => [person.id, person.userId, person.user?.id].some((id) => id && String(id) === String(userId)));
        if (!resident) return "Unknown user";
        return resident.displayName || [resident.firstName, resident.middleName, resident.lastName].filter(Boolean).join(" ") || resident.email || resident.mobile || "Resident";
    };
    const stats = [
        ["Total notifications", notifications.length, Bell],
        ["Queued", notifications.filter((item) => ["PENDING", "PROCESSING"].includes(item.status)).length, Activity],
        ["Delivered", notifications.filter((item) => item.status === "DELIVERED").length, CheckCheck],
        ["Unread", notifications.filter((item) => !item.isRead).length, Mail],
        ["Failed", notifications.filter((item) => item.status === "FAILED").length, CircleAlert]
    ];
    const filteredRows = useMemo(() => {
        let source = active === "templates" ? templates : active === "preferences" ? preferences : active === "broadcasts" ? broadcasts : notifications;
        if (active === "reports" && filter !== "ALL") source = source.filter((item) => item.status === filter || (filter === "READ" && item.isRead) || (filter === "UNREAD" && !item.isRead));
        const query = search.trim().toLowerCase();
        return source.filter((item) => !query || Object.values(item).map((value) => typeof value === "object" ? JSON.stringify(value) : String(value ?? "")).join(" ").toLowerCase().includes(query));
    }, [active, templates, preferences, broadcasts, notifications, filter, search]);

    const announce = (message) => { setNotice(message); window.setTimeout(() => setNotice(""), 3600); };
    const act = async (operation, successMessage) => {
        try { setBusy(true); setError(""); await operation(); await load(); if (successMessage) announce(successMessage); }
        catch (err) { setError(errorText(err)); }
        finally { setBusy(false); }
    };
    const openForm = (type, record = null) => { setEdit(record); setForm(type); setError(""); if (type === "broadcast") setBroadcastAudience(record?.audienceType || "SOCIETY"); };

    const submit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const payload = Object.fromEntries(formData.entries());
        const sid = societyId();
        let successMessage = edit ? "Changes saved." : "Record created.";
        try {
            setBusy(true); setError("");
            if (form === "notification") {
                payload.societyId = sid;
                payload.data = payload.data ? JSON.parse(payload.data) : undefined;
                if (!payload.templateId) delete payload.templateId;
                if (!payload.scheduledAt) delete payload.scheduledAt;
                else payload.scheduledAt = new Date(payload.scheduledAt).toISOString();
                if (edit?.id) {
                    await notificationsApi.updateNotification(edit.id, payload);
                    successMessage = "Notification changes saved.";
                } else {
                    const scheduled = Boolean(payload.scheduledAt);
                    const created = await notificationsApi.createNotification(payload);
                    if (scheduled) {
                        successMessage = "Notification scheduled and added to the queue.";
                    } else {
                        const notificationId = created?.data?.id || created?.id || created?.notification?.id;
                        if (!notificationId) {
                            successMessage = "Notification created. Open the queue to send it.";
                        } else {
                            try {
                                await notificationsApi.sendNotification(notificationId);
                                successMessage = "Notification sent to the selected user.";
                            } catch (sendError) {
                                setForm(""); setEdit(null); await load();
                                setError(`Notification was created, but sending failed: ${errorText(sendError)}`);
                                return;
                            }
                        }
                    }
                }
            } else if (form === "template") {
                payload.societyId = sid || null;
                payload.variables = payload.variables?.trim() ? JSON.parse(payload.variables) : [];
                if (!payload.subject) delete payload.subject;
                if (!payload.title) delete payload.title;
                if (!payload.description) delete payload.description;
                if (edit?.id) await notificationsApi.updateTemplate(edit.id, payload);
                else await notificationsApi.createTemplate(payload);
            } else if (form === "preference") {
                payload.societyId = sid;
                payload.userId = payload.userId || currentUserId;
                for (const key of ["enabled", "allowMarketing", "allowOperational", "allowEmergency"]) payload[key] = formData.get(key) === "on";
                await notificationsApi.createPreference(payload);
            } else if (form === "broadcast") {
                payload.societyId = sid;
                payload.channels = formData.getAll("channels");
                payload.audienceIds = payload.audienceType === "SOCIETY" ? [] : formData.getAll("audienceIds");
                if (!payload.scheduledAt) delete payload.scheduledAt;
                else payload.scheduledAt = new Date(payload.scheduledAt).toISOString();
                if (!payload.startAt) delete payload.startAt;
                else payload.startAt = new Date(payload.startAt).toISOString();
                if (!payload.endAt) delete payload.endAt;
                else payload.endAt = new Date(payload.endAt).toISOString();
                if (!payload.subject) delete payload.subject;
                if (!payload.remarks) delete payload.remarks;
                if (edit?.id) await notificationsApi.updateBroadcast(edit.id, payload);
                else await notificationsApi.createBroadcast(payload);
            }
            setForm(""); setEdit(null); await load(); announce(successMessage);
        } catch (err) { setError(err instanceof SyntaxError ? "Check the JSON format in the data field." : errorText(err)); }
        finally { setBusy(false); }
    };

    const notificationActions = (item) => <div className="society-row-actions">
        <button className="notification-row-action" disabled={busy} onClick={() => act(() => item.isRead ? notificationsApi.markUnread(item.id) : notificationsApi.markRead(item.id), item.isRead ? "Marked unread." : "Marked read.")}>{item.isRead ? "Mark unread" : "Mark read"}</button>
        {item.status === "PENDING" && <button className="notification-row-action" disabled={busy} onClick={() => act(() => notificationsApi.sendNotification(item.id), "Notification dispatched to the selected channel.")}>Send now</button>}
        {item.status === "SENT" && <button className="notification-row-action" disabled={busy} onClick={() => act(() => notificationsApi.markDelivered(item.id), "Delivery recorded.")}>Mark delivered</button>}
        {item.status === "FAILED" && <button className="notification-row-action" disabled={busy} onClick={() => act(() => notificationsApi.updateNotification(item.id, { status: "PENDING", errorMessage: null }), "Notification queued for retry.")}>Retry</button>}
        {item.status === "FAILED" && <button className="notification-row-action" disabled={busy} onClick={() => act(() => notificationsApi.markFailed(item.id, item.errorMessage || "Retry failed"), "Failure recorded.")}>Record retry failure</button>}
        {item.status !== "DELIVERED" && item.status !== "CANCELLED" && <button className="notification-row-action" disabled={busy} onClick={() => act(() => notificationsApi.cancelNotification(item.id), "Notification cancelled.")}>Cancel</button>}
        {!["SENT", "DELIVERED"].includes(item.status) && <button className="notification-icon-action danger" title="Delete notification" aria-label="Delete notification" disabled={busy} onClick={() => window.confirm("Delete this notification?") && act(() => notificationsApi.deleteNotification(item.id), "Notification deleted.")}><Trash2 size={15}/></button>}
    </div>;

    const templateActions = (item) => <div className="society-row-actions">
        <button className="notification-row-action" disabled={busy} onClick={() => openForm("template", item)}>Edit</button>
        <button className="notification-row-action" disabled={busy} onClick={() => act(() => item.status === "ACTIVE" ? notificationsApi.deactivateTemplate(item.id) : notificationsApi.activateTemplate(item.id), item.status === "ACTIVE" ? "Template deactivated." : "Template activated.")}>{item.status === "ACTIVE" ? "Deactivate" : "Activate"}</button>
        {item.status !== "ACTIVE" && <button className="notification-icon-action danger" title="Delete template" aria-label="Delete template" disabled={busy} onClick={() => window.confirm("Delete this template?") && act(() => notificationsApi.deleteTemplate(item.id), "Template deleted.")}><Trash2 size={15}/></button>}
    </div>;

    const preferenceActions = (item) => <div className="society-row-actions notification-preference-actions">
        {[["allowOperational", "Operational"], ["allowMarketing", "Marketing"], ["allowEmergency", "Emergency"]].map(([key, label]) => <button key={key} className={`notification-toggle${item[key] ? " enabled" : ""}`} disabled={busy} onClick={() => act(() => notificationsApi.updatePreference(item.id, { [key]: !item[key] }))}>{label} {item[key] ? "On" : "Off"}</button>)}
        <button className="notification-row-action" disabled={busy} onClick={() => act(() => item.enabled ? notificationsApi.disablePreference(item.id) : notificationsApi.enablePreference(item.id), item.enabled ? "Preference disabled." : "Preference enabled.")}>{item.enabled ? "Disable" : "Enable"}</button>
        <button className="notification-icon-action danger" title="Delete preference" aria-label="Delete preference" disabled={busy} onClick={() => window.confirm("Delete this preference?") && act(() => notificationsApi.deletePreference(item.id), "Preference deleted.")}><Trash2 size={15}/></button>
    </div>;

    const broadcastActions = (item) => <div className="society-row-actions">
        {["DRAFT", "SCHEDULED", "FAILED"].includes(item.status) && <button className="notification-row-action" disabled={busy} onClick={() => openForm("broadcast", item)}>Edit</button>}
        {item.status === "DRAFT" && <button className="notification-row-action" disabled={busy} onClick={() => { const value = window.prompt("Schedule date and time (YYYY-MM-DDTHH:mm)"); if (value) act(() => notificationsApi.scheduleBroadcast(item.id, new Date(value).toISOString()), "Broadcast scheduled."); }}>Schedule</button>}
        {["DRAFT", "SCHEDULED", "FAILED"].includes(item.status) && <button className="notification-row-action" disabled={busy} onClick={() => act(() => notificationsApi.startBroadcast(item.id), "Broadcast marked as sending.")}>Start</button>}
        {item.status === "SENDING" && <button className="notification-row-action" disabled={busy} onClick={() => { const count = window.prompt("Number of recipients reached", String(item.recipientCount || 0)); if (count !== null) act(() => notificationsApi.markBroadcastSent(item.id, Number(count)), "Broadcast marked sent."); }}>Mark sent</button>}
        {!(["SENT", "CANCELLED"].includes(item.status)) && <button className="notification-row-action" disabled={busy} onClick={() => act(() => notificationsApi.cancelBroadcast(item.id), "Broadcast cancelled.")}>Cancel</button>}
        {!["SENDING", "SENT"].includes(item.status) && <button className="notification-icon-action danger" title="Delete broadcast" aria-label="Delete broadcast" disabled={busy} onClick={() => window.confirm("Delete this broadcast?") && act(() => notificationsApi.deleteBroadcast(item.id), "Broadcast deleted.")}><Trash2 size={15}/></button>}
    </div>;

    const tableRows = () => {
        if (active === "templates") return filteredRows.map((item) => <tr key={item.id}><td><strong>{item.templateName}</strong><small>{item.templateCode}</small></td><td>{titleCase(item.channel)}</td><td>{item.subject || item.title || "—"}</td><td className="notification-message-cell">{item.messageTemplate}</td><td><span className={`notification-status ${String(item.status).toLowerCase()}`}>{titleCase(item.status)}</span></td><td>{templateActions(item)}</td></tr>);
        if (active === "preferences") return filteredRows.map((item) => <tr key={item.id}><td>{titleCase(item.channel)}</td><td>{preferenceUserName(item.userId)}</td><td>{item.allowOperational ? "On" : "Off"}</td><td>{item.allowMarketing ? "On" : "Off"}</td><td>{item.allowEmergency ? "On" : "Off"}</td><td><span className={`notification-status ${item.enabled ? "delivered" : "cancelled"}`}>{item.enabled ? "Enabled" : "Disabled"}</span></td><td>{preferenceActions(item)}</td></tr>);
        if (active === "broadcasts") return filteredRows.map((item) => <tr key={item.id}><td><strong>{item.title}</strong><small>{titleCase(item.broadcastType)}</small></td><td>{titleCase(item.audienceType)}{Array.isArray(item.audienceIds) && item.audienceIds.length ? ` · ${item.audienceIds.length} selected` : ""}</td><td>{(item.channels || []).map(titleCase).join(", ")}</td><td>{dateTime(item.scheduledAt || item.sentAt || item.created_at)}</td><td>{item.recipientCount || 0}</td><td>{item.deliveredCount || 0} / {item.failedCount || 0}</td><td><span className={`notification-status ${String(item.status).toLowerCase()}`}>{titleCase(item.status)}</span></td><td>{broadcastActions(item)}</td></tr>);
        return filteredRows.map((item) => <tr key={item.id}><td><strong>{item.title || item.subject || titleCase(item.notificationType)}</strong><small>{dateTime(item.created_at)}</small></td><td>{titleCase(item.channel)}</td><td>{titleCase(item.notificationType)}</td><td>{item.message}</td><td><span className={`notification-status ${String(item.status).toLowerCase()}`}>{titleCase(item.status)}</span></td><td>{item.isRead ? dateTime(item.readAt) : "Unread"}</td><td>{item.retryCount || 0}{item.errorMessage ? <small className="notification-error-detail">{item.errorMessage}</small> : null}</td><td>{notificationActions(item)}</td></tr>);
    };

    const tableHead = active === "templates" ? ["Template", "Channel", "Subject / title", "Message template", "Status", "Actions"] : active === "preferences" ? ["Channel", "User", "Operational", "Marketing", "Emergency", "Status", "Actions"] : active === "broadcasts" ? ["Broadcast", "Audience", "Channels", "Scheduled / sent", "Recipients", "Delivered / failed", "Status", "Actions"] : ["Notification", "Channel", "Type", "Message", "Delivery status", "Read status", "Retries / error", "Actions"];

    return <section className={`society-dashboard notification-page${active === "preferences" ? " notification-preferences-page" : ""}`}>
        <header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot"/> COMMUNICATIONS</div><h1>Notifications & communication</h1><p>Manage messages, delivery, channel preferences, templates, and society broadcasts.</p></div><button className="society-add-button" onClick={load} disabled={loading}><RefreshCw size={16}/> Refresh</button></header>
        {error && <div className="society-error" role="alert">{error}<button onClick={load}>Try again</button></div>}
        {notice && <div className="notification-success" role="status">{notice}</div>}
        <nav className="security-tabs" aria-label="Notification sections">{sections.map(([key, label, Icon]) => <button key={key} type="button" className={active === key ? "active" : ""} onClick={() => { setActive(key); setSearch(""); setFilter("ALL"); }}><Icon size={16}/>{label}</button>)}</nav>

        {active === "overview" ? <>
            <div className="society-stats notification-stats">{stats.map(([label, count, Icon]) => <article className="society-stat-card" key={label}><span className="society-stat-icon society-stat-icon-blue"><Icon size={18}/></span><div><span className="society-stat-label">{label}</span><strong>{loading ? "—" : count}</strong></div></article>)}</div>
            <div className="notification-dashboard-grid">
                <section className="society-list-panel"><div className="society-list-heading"><div><h2>Delivery by channel</h2><p>Current notification volume grouped by delivery channel.</p></div></div><div className="notification-channel-list">{channels.map((channel) => { const Icon = channelIcons[channel]; const total = notifications.filter((item) => item.channel === channel).length; const delivered = notifications.filter((item) => item.channel === channel && item.status === "DELIVERED").length; return <div key={channel}><span className="notification-channel-icon"><Icon size={16}/></span><strong>{titleCase(channel)}</strong><div className="notification-meter"><span style={{ width: `${total ? Math.max(8, Math.round(delivered / total * 100)) : 0}%` }}/></div><small>{delivered} / {total} delivered</small></div>; })}</div></section>
                <section className="society-list-panel"><div className="society-list-heading"><div><h2>Recent activity</h2><p>Latest queued and completed notifications.</p></div><button className="notification-text-link" onClick={() => setActive("notifications")}>View all <ChevronRight size={14}/></button></div><div className="notification-recent-list">{notifications.slice(0, 5).map((item) => <article key={item.id}><span className={`notification-status-dot ${String(item.status).toLowerCase()}`}/><div><strong>{item.title || item.subject || titleCase(item.notificationType)}</strong><small>{titleCase(item.channel)} · {dateTime(item.created_at)}</small></div><span className={`notification-status ${String(item.status).toLowerCase()}`}>{titleCase(item.status)}</span></article>)}{!loading && !notifications.length && <p className="notification-empty-inline">No notifications have been created yet.</p>}</div></section>
            </div>
            <div className="notification-shortcuts">{[["notifications", "Notifications", notifications.length, Bell], ["templates", "Templates", templates.length, FileText], ["preferences", "Preferences", preferences.length, Settings2], ["broadcasts", "Broadcasts", broadcasts.length, Megaphone], ["reports", "Delivery reports", notifications.filter((item) => item.status === "FAILED").length, CheckCheck]].map(([target, label, count, Icon]) => <button key={target} className="notification-shortcut" onClick={() => setActive(target)}><Icon size={18}/><span>{label}</span><strong>{count}</strong></button>)}</div>
        </> : <section className="society-list-panel notification-list-panel">
            <div className="society-list-heading"><div><h2>{sections.find(([key]) => key === active)?.[1]}</h2><p>{active === "notifications" ? "Queue, update, and track delivery and read states." : active === "templates" ? "Create reusable channel-specific messages and manage template availability." : active === "preferences" ? "Control operational, marketing, and emergency delivery by channel." : active === "broadcasts" ? "Send or schedule notices to the society, selected towers, or selected users." : "Review delivery states, read receipts, and provider failures."}</p></div><span className="society-count">{loading ? "Loading…" : `${filteredRows.length} records`}</span></div>
            <div className="society-toolbar"><label className="society-search"><Search size={16}/><input placeholder="Search records" aria-label="Search notification records" value={search} onChange={(event) => setSearch(event.target.value)}/></label>
                {active === "reports" && <select aria-label="Filter delivery reports" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="ALL">All delivery states</option>{statusOptions.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}<option value="READ">Read</option><option value="UNREAD">Unread</option></select>}
                {active === "notifications" && <button className="society-add-button" onClick={() => openForm("notification")}><Plus size={16}/> New notification</button>}
                {active === "templates" && <button className="society-add-button" onClick={() => openForm("template")}><Plus size={16}/> New template</button>}
                {active === "preferences" && <button className="society-add-button" onClick={() => openForm("preference")} disabled={!currentUserId && !people.length}><Plus size={16}/> Add preference</button>}
                {active === "broadcasts" && <button className="society-add-button" onClick={() => openForm("broadcast")}><Plus size={16}/> Create broadcast</button>}
            </div>
            {loading ? <div className="society-loading">Loading notification records…</div> : filteredRows.length === 0 ? <div className="society-empty"><h3>No records found</h3><p>{active === "preferences" && !currentUserId ? "Sign in with a valid user profile to create preferences." : "Create a record or adjust the search and filters."}</p></div> : <div className="society-table-wrap"><table className="society-table notification-table"><thead><tr>{tableHead.map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{tableRows()}</tbody></table></div>}
        </section>}

        {form && <div className="society-modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) { setForm(""); setEdit(null); } }}><section className="society-form-modal notification-modal"><header className="society-form-header"><div><h2>{edit ? "Edit " : "Create "}{form === "notification" ? "notification" : form === "template" ? "message template" : form === "preference" ? "channel preference" : "broadcast"}</h2><p>{form === "notification" ? "Choose a user and channel. New notifications are sent immediately unless scheduled." : "Enter the details below. Related records are selected from this society."}</p></div><button type="button" className="modal-close-btn" aria-label="Close dialog" onClick={() => { setForm(""); setEdit(null); }}>×</button></header>
            <form onSubmit={submit}><div className="notification-form-grid">
                {form === "notification" && <>
                    <label>Recipient<select name="userId" defaultValue={edit?.userId || currentUserId || people[0]?.id || ""} required><option value="" disabled>Select recipient</option>{people.map((person) => <option key={person.id} value={person.id}>{person.label}</option>)}</select></label>
                    <label>Template<select name="templateId" defaultValue={edit?.templateId || ""} onChange={(event) => { const selected = templates.find((item) => String(item.id) === event.target.value); if (!selected) return; const formElement = event.currentTarget.form; formElement.elements.channel.value = selected.channel; formElement.elements.title.value = selected.title || selected.templateName; formElement.elements.subject.value = selected.subject || ""; formElement.elements.message.value = selected.messageTemplate; }}><option value="">Write a new message</option>{templates.filter((item) => item.status === "ACTIVE").map((item) => <option key={item.id} value={item.id}>{item.templateName} · {titleCase(item.channel)}</option>)}</select></label>
                    <label>Channel<select name="channel" defaultValue={edit?.channel || "IN_APP"} required>{channels.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}</select></label>
                    <label>Notification type<select name="notificationType" defaultValue={edit?.notificationType || "OPERATIONAL"}>{typeOptions.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}</select></label>
                    <label>Title<input name="title" defaultValue={edit?.title || ""}/></label>
                    <label>Subject<input name="subject" defaultValue={edit?.subject || ""}/></label>
                    <label className="wide">Message<textarea name="message" rows="4" defaultValue={edit?.message || ""} required/></label>
                    <label>Priority<select name="priority" defaultValue={edit?.priority || "MEDIUM"}>{priorityOptions.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}</select></label>
                    <label>Schedule (optional)<input name="scheduledAt" type="datetime-local" defaultValue={edit?.scheduledAt ? String(edit.scheduledAt).slice(0,16) : ""}/></label>
                    <label className="wide">Additional data (JSON)<textarea name="data" rows="2" defaultValue={edit?.data ? JSON.stringify(edit.data, null, 2) : ""} placeholder='{"source":"notice"}'/></label>
                </>}
                {form === "template" && <>
                    <label>Template code<input name="templateCode" defaultValue={edit?.templateCode || ""} required/></label>
                    <label>Template name<input name="templateName" defaultValue={edit?.templateName || ""} required/></label>
                    <label>Channel<select name="channel" defaultValue={edit?.channel || "IN_APP"} required>{channels.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}</select></label>
                    <label>Status<select name="status" defaultValue={edit?.status || "ACTIVE"}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
                    <label>Title<input name="title" defaultValue={edit?.title || ""}/></label>
                    <label>Subject<input name="subject" defaultValue={edit?.subject || ""}/></label>
                    <label className="wide">Message template<textarea name="messageTemplate" rows="5" defaultValue={edit?.messageTemplate || ""} required/></label>
                    <label>Variables (JSON array)<textarea name="variables" rows="2" defaultValue={JSON.stringify(edit?.variables || [])} placeholder='["residentName","unitNumber"]'/></label>
                    <label>Description<textarea name="description" rows="2" defaultValue={edit?.description || ""}/></label>
                </>}
                {form === "preference" && <>
                    <label>User<select name="userId" defaultValue={currentUserId || people[0]?.id || ""} required><option value="" disabled>Select user</option>{people.map((person) => <option key={person.id} value={person.id}>{person.label}</option>)}</select></label>
                    <label>Channel<select name="channel" defaultValue="IN_APP" required>{channels.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}</select></label>
                    {[ ["enabled", "Channel enabled", true], ["allowOperational", "Operational messages", true], ["allowMarketing", "Marketing messages", false], ["allowEmergency", "Emergency messages", true] ].map(([key, label, checked]) => <label className="notification-checkbox" key={key}><input name={key} type="checkbox" defaultChecked={checked}/>{label}</label>)}
                </>}
                {form === "broadcast" && <>
                    <label>Title<input name="title" defaultValue={edit?.title || ""} required/></label>
                    <label>Subject<input name="subject" defaultValue={edit?.subject || ""}/></label>
                    <label>Type<select name="broadcastType" defaultValue={edit?.broadcastType || "NOTICE"}>{["NOTICE", "ANNOUNCEMENT", "ALERT", "EMERGENCY"].map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}</select></label>
                    <label>Priority<select name="priority" defaultValue={edit?.priority || "MEDIUM"}>{priorityOptions.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}</select></label>
                    <label>Audience<select name="audienceType" value={broadcastAudience} onChange={(event) => setBroadcastAudience(event.target.value)}><option value="SOCIETY">Entire society</option><option value="TOWER">Selected towers</option><option value="USERS">Selected residents</option></select></label>
                    <label>Schedule (optional)<input name="scheduledAt" type="datetime-local" defaultValue={edit?.scheduledAt ? String(edit.scheduledAt).slice(0,16) : ""}/></label>
                    {broadcastAudience !== "SOCIETY" && <label className="wide">{broadcastAudience === "TOWER" ? "Towers" : "Residents"}<select name="audienceIds" multiple size="4" defaultValue={edit?.audienceType === broadcastAudience ? edit?.audienceIds || [] : []}>{(broadcastAudience === "TOWER" ? (data.towers || []).map((item) => ({ id: item.id, label: item.name || item.towerName || "Tower" })) : people).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><small>Select all intended recipients. Use Ctrl or Command to select multiple.</small></label>}
                    <fieldset className="notification-channels wide"><legend>Delivery channels</legend>{channels.map((channel) => <label key={channel}><input type="checkbox" name="channels" value={channel} defaultChecked={(edit?.channels || ["IN_APP"]).includes(channel)}/>{titleCase(channel)}</label>)}</fieldset>
                    <label>Starts at (optional)<input name="startAt" type="datetime-local" defaultValue={edit?.startAt ? String(edit.startAt).slice(0,16) : ""}/></label>
                    <label>Ends at (optional)<input name="endAt" type="datetime-local" defaultValue={edit?.endAt ? String(edit.endAt).slice(0,16) : ""}/></label>
                    <label className="wide">Message<textarea name="message" rows="4" defaultValue={edit?.message || ""} required/></label>
                    <label className="wide">Notes<textarea name="remarks" rows="2" defaultValue={edit?.remarks || ""}/></label>
                </>}
            </div><footer className="society-form-footer"><button type="button" className="btn-secondary" onClick={() => { setForm(""); setEdit(null); }}>Cancel</button><button type="submit" className="btn-primary" disabled={busy}>{busy ? (form === "notification" ? "Sending…" : "Saving…") : edit ? "Save changes" : form === "notification" ? "Send notification" : "Create record"}</button></footer></form>
        </section></div>}
    </section>;
}
