import { Fragment } from "react";
import { CalendarDays, CircleAlert, FileText, MessageSquare, Plus, Users } from "lucide-react";

const columns = {
    groups: ["groupType"], members: ["role"], forums: [], posts: ["postType", "createdAt"],
    classifieds: ["category", "price", "condition"], events: ["category", "venue", "startAt"], rsvps: ["totalTickets", "guestCount", "participantNames", "paymentStatus", "teamName"],
    meetings: ["meetingType", "scheduledAt"], agendas: ["agendaOrder", "description"], attendance: ["residentId", "checkInTime"],
    minutes: ["preparedBy", "approvedAt"], actions: ["assigneeId", "dueDate"], governance: ["meetingType", "scheduledAt"],
    moderation: ["contentType", "reason"], voting: ["votingType", "ballotType", "startAt", "endAt"], rules: ["ruleType", "effectiveFrom", "effectiveTo"]
};
const iconFor = { groups: Users, members: Users, forums: MessageSquare, posts: MessageSquare, classifieds: FileText, events: CalendarDays, rsvps: CalendarDays, meetings: CalendarDays, agendas: FileText, attendance: Users, minutes: FileText, actions: FileText, governance: Users, moderation: CircleAlert, voting: CircleAlert, rules: FileText };
const headline = (row) => row.title || row.name || row.subject || row.itemName || row.meetingNumber || row.id || "Community record";
const labelOf = (value) => value.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ");
const valueOf = (row, key) => {
    const value = row[key];
    if (Array.isArray(value)) return value.map((item) => typeof item === "string" ? item : item?.name || item?.title || "").filter(Boolean).join(", ") || "—";
    if (value == null || value === "") return "—";
    if (/At$|Date$/.test(key)) return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    if (typeof value === "object") return value.name || value.title || "—";
    return String(value).slice(0, 90);
};

export default function CommunityResourcePanel({ resource, title, rows = [], loading, onCreate, onAction, onDelete, onOpenRelated, relatedLabel = "Open details", onOpenParticipants, expandedRelatedId, relatedRows = {}, loadingRelatedId, readOnly = false }) {
    const Icon = iconFor[resource] || FileText;
    const fields = columns[resource] || [];
    return <section className={`society-list-panel community-resource-panel community-resource-${resource}${readOnly ? " community-read-only" : ""}`}>
        <div className="society-list-heading"><div><h2>{title}</h2><p>Manage {title.toLowerCase()} and review their current status.</p></div><div className="society-row-actions">{onCreate && <button className="society-add-button" onClick={onCreate}><Plus size={18} strokeWidth={2.4} aria-hidden="true" /> Add {title.replace(/s$/, "")}</button>}</div></div>
        {loading ? <div className="society-loading">Loading {title.toLowerCase()}…</div> : rows.length ? <div className="society-table-wrap"><table className={`society-table community-table-${resource}`}><thead><tr><th>{resource === "rsvps" ? "Participant" : title.replace(/s$/, "")}</th>{fields.map((field) => <th key={field}>{resource === "agendas" && field === "agendaOrder" ? "Sequence order" : resource === "rsvps" && field === "totalTickets" ? "Participant count" : labelOf(field)}</th>)}<th>Status</th><th className="society-actions-heading">Actions</th></tr></thead><tbody>{rows.map((row) => {
            const rowId = row.id ?? row.uuid ?? row._id;
            const participants = relatedRows[rowId] || [];
            return <Fragment key={rowId}><tr><td>{resource === "rsvps" ? <><strong>{row.participantName || "Resident"}</strong>{row.participantPhone && <small>{row.participantPhone}</small>}{row.participantEmail && <small>{row.participantEmail}</small>}</> : <><strong>{headline(row)}</strong>{row.description && <small>{String(row.description).slice(0, 100)}</small>}</>}</td>{fields.map((field) => <td key={field}>{valueOf(row, field)}</td>)}<td>{row.status || (row.isActive === false ? "Inactive" : "Active")}</td><td><div className="society-row-actions">{(onAction ? onAction(row) : []).map(({ label, run }) => <button className="society-workflow-action" key={label} onClick={() => run(row)}>{label}</button>)}{onOpenRelated && <button className="society-workflow-action" onClick={() => onOpenRelated(row)}><Icon size={14}/>{relatedLabel}</button>}{onOpenParticipants && <button type="button" className="society-workflow-action" onClick={() => onOpenParticipants(row)} aria-expanded={expandedRelatedId === rowId}><Users size={14}/>{expandedRelatedId === rowId ? "Hide participants" : "Participants"}</button>}{onDelete && <button className="society-icon-action society-delete-action" title="Delete record" onClick={() => onDelete(row)}>Delete</button>}</div></td></tr>
              {onOpenParticipants && expandedRelatedId === rowId && <tr className="community-event-participants-row"><td colSpan={fields.length + 3}><div className="community-event-participants">{loadingRelatedId === rowId ? <div className="society-loading">Loading participants…</div> : participants.length ? <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Resident</th><th>Mobile</th><th>Email</th><th>Participant names</th><th>Tickets</th><th>Guests</th><th>Team</th><th>Status</th></tr></thead><tbody>{participants.map((participant, index) => <tr key={participant.id ?? participant.uuid ?? `${participant.userId}-${index}`}><td>{participant.participantName || "Resident"}</td><td>{participant.participantPhone || "—"}</td><td>{participant.participantEmail || "—"}</td><td>{Array.isArray(participant.participantNames) ? participant.participantNames.map((person) => typeof person === "string" ? person : person?.name || "").filter(Boolean).join(", ") || "—" : "—"}</td><td>{participant.totalTickets ?? 0}</td><td>{participant.guestCount ?? 0}</td><td>{participant.teamName || "—"}</td><td>{participant.status || "Registered"}</td></tr>)}</tbody></table></div> : <div className="society-empty">No participants have registered for this event yet.</div>}</div></td></tr>}</Fragment>;
        })}</tbody></table></div> : <div className="society-empty"><Icon size={24}/><h3>No {title.toLowerCase()} found</h3><p>Add a record or adjust the search filter.</p>{onCreate && <button className="society-add-button" onClick={onCreate}><Plus size={18} strokeWidth={2.4} aria-hidden="true" /> Add first record</button>}</div>}
    </section>;
}
