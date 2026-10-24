import { useEffect, useState } from "react";
import { BellRing, CalendarClock, Check, Plus, RefreshCw, Trash2 } from "lucide-react";
import agreementApi from "../api/agreement.api";
import agreementRenewalApi from "../api/agreementRenewal.api";
import agreementReminderApi from "../api/agreementReminder.api";
import agreementNotificationApi from "../api/agreementNotification.api";
import societyApi from "../../societies/api/society.api";
import { useAuth } from "../../../app/providers/useAuth";

const rowsFrom = (response) => {
    const rows = Array.isArray(response) ? response : response?.data || response?.records || [];
    return Array.isArray(rows) ? rows : [];
};

const formatDateValue = (value) => {
    if (!value) return "—";
    const text = String(value).trim();
    if (!text) return "—";
    return text.slice(0, 10);
};

const AgreementLifecyclePage = () => {
    const { user } = useAuth();
    const [agreements, setAgreements] = useState([]);
    const [renewals, setRenewals] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [societies, setSocieties] = useState([]);
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [showRenewalForm, setShowRenewalForm] = useState(false);
    const [showConfigForm, setShowConfigForm] = useState(false);
    const [renewalValues, setRenewalValues] = useState({ agreementId: "", proposedStartDate: "", proposedExpiryDate: "" });
    const [configValues, setConfigValues] = useState({ societyId: "", daysBeforeExpiry: "30", reminderType: "FIRST_REMINDER" });

    const loadData = async () => {
        setLoading(true);
        setError("");
        const results = await Promise.allSettled([
            agreementApi.getAll(), agreementRenewalApi.getAll(), agreementReminderApi.getAll(),
            agreementNotificationApi.getAll(), societyApi.getAll()
        ]);
        const setters = [setAgreements, setRenewals, setReminders, setNotifications, setSocieties];
        results.forEach((result, index) => {
            if (result.status === "fulfilled") setters[index](rowsFrom(result.value));
        });
        const failure = results.find((result) => result.status === "rejected");
        if (failure) setError(failure.reason?.response?.data?.message || "Some agreement lifecycle records could not be loaded.");
        const societyRows = results[4].status === "fulfilled" ? rowsFrom(results[4].value) : [];
        if (societyRows.length) {
            const configsResult = await Promise.allSettled(societyRows.map((society) => agreementReminderApi.getConfigsBySociety(society.id)));
            setConfigs(configsResult.flatMap((result) => result.status === "fulfilled" ? rowsFrom(result.value) : []));
        } else {
            setConfigs([]);
        }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const getAgreementLabel = (agreementId, fallbackReference) =>
        agreements.find((agreement) => String(agreement.id) === String(agreementId))?.agreementReference
        || fallbackReference
        || "Agreement";

    const runRenewalAction = async (renewal, action) => {
        const currentUserId = user?.id || user?.userId || user?.user?.id;
        try {
            setBusy(true); setError("");
            if (action === "submit") await agreementRenewalApi.submit(renewal.id);
            if (action === "review") await agreementRenewalApi.review(renewal.id);
            if (action === "approve") await agreementRenewalApi.approve(renewal.id, "Approved by society management", currentUserId);
            if (action === "complete") await agreementRenewalApi.complete(renewal.id);
            if (action === "information" || action === "reject") {
                const remarks = window.prompt(action === "reject" ? "Reason for rejection:" : "Information required:");
                if (remarks === null || !remarks.trim()) return;
                if (action === "reject") await agreementRenewalApi.reject(renewal.id, remarks);
                else await agreementRenewalApi.requestInformation(renewal.id, remarks);
            }
            await loadData();
        } catch (err) { setError(err.response?.data?.message || err.message || "Could not update renewal."); }
        finally { setBusy(false); }
    };

    const createRenewal = async (event) => {
        event.preventDefault();
        const agreement = agreements.find((item) => item.id === renewalValues.agreementId);
        if (!agreement) return setError("Select an agreement first.");
        try {
            setBusy(true); setError("");
            await agreementRenewalApi.create({ ...renewalValues, requestedBy: user?.id || user?.userId || user?.user?.id || undefined });
            setShowRenewalForm(false);
            setRenewalValues({ agreementId: "", proposedStartDate: "", proposedExpiryDate: "" });
            await loadData();
        } catch (err) { setError(err.response?.data?.message || "Could not create renewal."); }
        finally { setBusy(false); }
    };

    const createConfig = async (event) => {
        event.preventDefault();
        try {
            setBusy(true); setError("");
            await agreementReminderApi.createConfig({ ...configValues, daysBeforeExpiry: Number(configValues.daysBeforeExpiry) });
            setShowConfigForm(false);
            await loadData();
        } catch (err) { setError(err.response?.data?.message || "Could not save reminder configuration."); }
        finally { setBusy(false); }
    };

    const runReminderAction = async (action, id) => {
        try {
            setBusy(true); setError(""); setNotice("");
            let generationNotice = "";
            if (action === "generate") {
                const response = await agreementReminderApi.generateAll();
                const results = rowsFrom(response);
                const scheduleCount = results.reduce((count, result) => count + (Array.isArray(result.reminders) ? result.reminders.length : 0), 0);
                const activeAgreements = agreements.filter((agreement) => ["ACTIVE", "EXPIRING_SOON", "RENEWAL_INITIATED"].includes(agreement.status));
                const eligibleAgreements = activeAgreements.filter((agreement) => configs.some((config) => config.enabled && config.societyId === agreement.societyId));

                if (scheduleCount > 0) {
                    generationNotice = `Reminder generation finished: ${scheduleCount} schedule(s) available across ${eligibleAgreements.length} eligible active agreement(s).`;
                } else if (!activeAgreements.length) {
                    generationNotice = "No reminders generated. Activate an agreement first; drafts and agreements awaiting approval are not included.";
                } else if (!eligibleAgreements.length) {
                    generationNotice = "No reminders generated. Add or enable reminder rules for the societies with active agreements.";
                } else {
                    generationNotice = "No reminder schedules were returned. Check the backend log and confirm the agreement expiry dates and reminder rules.";
                }
            }
            else if (action === "process") await agreementReminderApi.process(id);
            else if (action === "process-notification") await agreementNotificationApi.process(id);
            else if (action === "read") await agreementNotificationApi.markRead(id);
            else if (action === "delete-config") await agreementReminderApi.deleteConfig(id);
            else if (action === "delete-reminder") await agreementReminderApi.delete(id);
            else if (action === "delete-notification") await agreementNotificationApi.delete(id);
            await loadData();
            if (generationNotice) setNotice(generationNotice);
        } catch (err) { setError(err.response?.data?.message || err.message || "Could not update reminder activity."); }
        finally { setBusy(false); }
    };

    return <section className="society-dashboard">
        <header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> AGREEMENT LIFECYCLE</div><h1>Renewals & reminders</h1><p>Manage renewal requests, expiry schedules, and resident notifications.</p></div><button className="society-refresh-button" onClick={loadData} disabled={loading}><RefreshCw size={16} className={loading ? "society-spinning" : ""} /> Refresh</button></header>
        {error && <div className="society-error" role="alert">{error}<button onClick={loadData}>Try again</button></div>}
        {notice && <div className="multi-society-notice" role="status">{notice}</div>}
        <div className="society-lifecycle-grid">
            <section className="society-list-panel">
                <div className="society-list-heading"><div><h2><CalendarClock size={17} /> Agreement renewals</h2><p>Submit, review, approve, reject, and complete renewals.</p></div><button className="society-add-button" onClick={() => setShowRenewalForm((value) => !value)}><Plus size={16} /> New renewal</button></div>
                {showRenewalForm && <form className="society-inline-form" onSubmit={createRenewal}><div className="form-grid"><div className="form-group form-group-full"><label htmlFor="renewal-agreement">Agreement</label><select id="renewal-agreement" required value={renewalValues.agreementId} onChange={(event) => setRenewalValues((value) => ({ ...value, agreementId: event.target.value }))}><option value="">Select active agreement</option>{agreements.filter((agreement) => ["ACTIVE", "EXPIRING_SOON", "RENEWAL_INITIATED"].includes(agreement.status)).map((agreement) => <option key={agreement.id} value={agreement.id}>{agreement.agreementReference} · expires {String(agreement.expiryDate || "").slice(0, 10)}</option>)}</select></div><div className="form-group"><label>Proposed start date</label><input type="date" required value={renewalValues.proposedStartDate} onChange={(event) => setRenewalValues((value) => ({ ...value, proposedStartDate: event.target.value }))} /></div><div className="form-group"><label>Proposed expiry date</label><input type="date" required value={renewalValues.proposedExpiryDate} onChange={(event) => setRenewalValues((value) => ({ ...value, proposedExpiryDate: event.target.value }))} /></div></div><div className="society-inline-actions"><button type="button" className="btn-secondary" onClick={() => setShowRenewalForm(false)}>Cancel</button><button type="submit" className="btn-primary" disabled={busy}><span className="button-plus" aria-hidden="true">+</span> Create renewal</button></div></form>}
                {loading ? <div className="society-loading">Loading renewals…</div> : <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Agreement</th><th>Expiry</th><th>Proposed term</th><th>Status</th><th>Actions</th></tr></thead><tbody>{renewals.map((renewal) => <tr key={renewal.id}><td>{renewal.existingAgreementReference || renewal.agreementId}</td><td>{formatDateValue(renewal.currentExpiryDate)}</td><td>{formatDateValue(renewal.proposedStartDate)} – {formatDateValue(renewal.proposedExpiryDate)}</td><td>{renewal.status}</td><td><div className="society-row-actions">{renewal.status === "DRAFT" || renewal.status === "ADDITIONAL_INFO_REQUIRED" ? <button className="society-workflow-action" disabled={busy} onClick={() => runRenewalAction(renewal, "submit")}>Submit</button> : null}{renewal.status === "SUBMITTED" ? <button className="society-workflow-action" disabled={busy} onClick={() => runRenewalAction(renewal, "review")}>Review</button> : null}{renewal.status === "UNDER_REVIEW" ? <><button className="society-workflow-action" disabled={busy} onClick={() => runRenewalAction(renewal, "approve")}>Approve</button><button className="society-icon-action" disabled={busy} title="Request more information" onClick={() => runRenewalAction(renewal, "information")}>Info</button><button className="society-icon-action society-delete-action" disabled={busy} title="Reject renewal" onClick={() => runRenewalAction(renewal, "reject")}>Reject</button></> : null}{renewal.status === "APPROVED" ? <button className="society-workflow-action" disabled={busy} onClick={() => runRenewalAction(renewal, "complete")}>Complete</button> : null}</div></td></tr>)}</tbody></table>{!renewals.length && <div className="society-empty"><h3>No renewal requests</h3></div>}</div>}
            </section>
            <section className="society-list-panel">
                <div className="society-list-heading"><div><h2><BellRing size={17} /> Reminder settings</h2><p>Configure when society agreement reminders are generated.</p></div><button className="society-add-button" onClick={() => setShowConfigForm((value) => !value)}><Plus size={16} /> Add rule</button></div>
                {showConfigForm && <form className="society-inline-form" onSubmit={createConfig}><div className="form-grid"><div className="form-group form-group-full"><label>Society</label><select required value={configValues.societyId} onChange={(event) => setConfigValues((value) => ({ ...value, societyId: event.target.value }))}><option value="">Select society</option>{societies.map((society) => <option key={society.id} value={society.id}>{society.name}</option>)}</select></div><div className="form-group"><label>Days before expiry</label><input type="number" min="0" required value={configValues.daysBeforeExpiry} onChange={(event) => setConfigValues((value) => ({ ...value, daysBeforeExpiry: event.target.value }))} /></div><div className="form-group"><label>Reminder type</label><select value={configValues.reminderType} onChange={(event) => setConfigValues((value) => ({ ...value, reminderType: event.target.value }))}><option>FIRST_REMINDER</option><option>SECOND_REMINDER</option><option>FINAL_REMINDER</option><option>EXPIRY_ALERT</option></select></div></div><div className="society-inline-actions"><button type="button" className="btn-secondary" onClick={() => setShowConfigForm(false)}>Cancel</button><button type="submit" className="btn-primary" disabled={busy}>Save rule</button></div></form>}
                <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Society</th><th>Type</th><th>Days before expiry</th><th>Actions</th></tr></thead><tbody>{configs.map((config) => <tr key={config.id}><td>{societies.find((society) => society.id === config.societyId)?.name || config.societyId}</td><td>{config.reminderType}</td><td>{config.daysBeforeExpiry}</td><td><button className="society-icon-action society-delete-action" title="Delete reminder rule" onClick={() => runReminderAction("delete-config", config.id)} disabled={busy}><Trash2 size={16} /></button></td></tr>)}</tbody></table>{!configs.length && <div className="society-empty"><h3>No reminder rules configured</h3></div>}</div>
            </section>
        </div>
        <section className="society-list-panel society-lifecycle-panel"><div className="society-list-heading"><div><h2>Scheduled reminders</h2><p>Generate upcoming reminders and process queued notices.</p></div><button className="society-workflow-action" onClick={() => runReminderAction("generate")} disabled={busy}>{busy ? "Working…" : "Generate reminders"}</button></div><div className="society-table-wrap"><table className="society-table"><thead><tr><th>Agreement</th><th>Type</th><th>Due</th><th>Status</th><th>Action</th></tr></thead><tbody>{reminders.map((reminder) => <tr key={reminder.id}><td>{getAgreementLabel(reminder.agreementId, reminder.agreementReference)}</td><td>{reminder.reminderType || reminder.type || "Reminder"}</td><td>{formatDateValue(reminder.scheduledAt || reminder.reminderDate)}</td><td>{reminder.status || "PENDING"}</td><td><div className="society-row-actions"><button className="society-workflow-action" disabled={busy || reminder.status === "SENT"} onClick={() => runReminderAction("process", reminder.id)}>Process</button><button className="society-icon-action society-delete-action" disabled={busy} title="Delete reminder" onClick={() => runReminderAction("delete-reminder", reminder.id)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table>{!reminders.length && <div className="society-empty"><h3>No scheduled reminders</h3></div>}</div></section>
        <section className="society-list-panel society-lifecycle-panel"><div className="society-list-heading"><div><h2>Agreement notifications</h2><p>Process delivery and mark notices as read.</p></div><span className="society-count">{notifications.length} notifications</span></div><div className="society-table-wrap"><table className="society-table"><thead><tr><th>Agreement</th><th>Channel</th><th>Recipient</th><th>Status</th><th>Actions</th></tr></thead><tbody>{notifications.map((notice) => <tr key={notice.id}><td>{getAgreementLabel(notice.agreementId, notice.agreementReference)}</td><td>{notice.channel || notice.notificationType || "—"}</td><td>{notice.recipientName || notice.recipient || "—"}</td><td>{notice.deliveryStatus || notice.status || (notice.isRead ? "READ" : "PENDING")}</td><td><div className="society-row-actions"><button className="society-workflow-action" disabled={busy} onClick={() => runReminderAction("process-notification", notice.id)}>Process</button><button className="society-icon-action" title="Mark as read" disabled={busy} onClick={() => runReminderAction("read", notice.id)}><Check size={16} /></button><button className="society-icon-action society-delete-action" title="Delete notification" disabled={busy} onClick={() => runReminderAction("delete-notification", notice.id)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table>{!notifications.length && <div className="society-empty"><h3>No agreement notifications</h3></div>}</div></section>
    </section>;
};

export default AgreementLifecyclePage;
