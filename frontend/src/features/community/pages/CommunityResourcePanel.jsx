import { CalendarDays, CircleAlert, FileText, MessageSquare, Users } from "lucide-react";

const columns = {
    groups: ["groupType"], members: ["role"], forums: [], posts: ["postType", "createdAt"],
    classifieds: ["category", "price", "condition"], events: ["category", "venue", "startAt"], rsvps: ["ticketCount", "paymentStatus"],
    meetings: ["meetingType", "scheduledAt"], agendas: ["agendaOrder", "description"], attendance: ["residentId", "checkInTime"],
    minutes: ["preparedBy", "approvedAt"], actions: ["assigneeId", "dueDate"], governance: ["meetingType", "scheduledAt"],
    moderation: ["contentType", "reason"], voting: ["votingType", "ballotType", "startAt", "endAt"], rules: ["ruleType", "effectiveFrom", "effectiveTo"]
};
const iconFor = { groups: Users, members: Users, forums: MessageSquare, posts: MessageSquare, classifieds: FileText, events: CalendarDays, rsvps: CalendarDays, meetings: CalendarDays, agendas: FileText, attendance: Users, minutes: FileText, actions: FileText, governance: Users, moderation: CircleAlert, voting: CircleAlert, rules: FileText };
const headline = (row) => row.title || row.name || row.subject || row.itemName || row.meetingNumber || row.id || "Community record";
const labelOf = (value) => value.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ");
const valueOf = (row, key) => {
    const value = row[key];
    if (value == null || value === "") return "—";
    if (/At$|Date$/.test(key)) return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    if (typeof value === "object") return value.name || value.title || "—";
    return String(value).slice(0, 90);
};

export default function CommunityResourcePanel({ resource, title, rows = [], loading, onCreate, onAction, onDelete, onOpenRelated, relatedLabel = "Open details", readOnly = false }) {
    const Icon = iconFor[resource] || FileText;
    const fields = columns[resource] || [];
    return <section className={`society-list-panel community-resource-panel community-resource-${resource}${readOnly ? " community-read-only" : ""}`}>
        <div className="society-list-heading"><div><h2>{title}</h2><p>Manage {title.toLowerCase()} and review their current status.</p></div><div className="society-row-actions">{onCreate && <button className="society-add-button" onClick={onCreate}>+ Add {title.replace(/s$/, "")}</button>}</div></div>
        {loading ? <div className="society-loading">Loading {title.toLowerCase()}…</div> : rows.length ? <div className="society-table-wrap"><table className={`society-table community-table-${resource}`}><thead><tr><th>{title.replace(/s$/, "")}</th>{fields.map((field) => <th key={field}>{resource === "agendas" && field === "agendaOrder" ? "Sequence order" : labelOf(field)}</th>)}<th>Status</th><th className="society-actions-heading">Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id ?? row.uuid ?? row._id}><td><strong>{headline(row)}</strong>{row.description && <small>{String(row.description).slice(0, 100)}</small>}</td>{fields.map((field) => <td key={field}>{valueOf(row, field)}</td>)}<td>{row.status || (row.isActive === false ? "Inactive" : "Active")}</td><td><div className="society-row-actions">{(onAction ? onAction(row) : []).map(({ label, run }) => <button className="society-workflow-action" key={label} onClick={() => run(row)}>{label}</button>)}{onOpenRelated && <button className="society-workflow-action" onClick={() => onOpenRelated(row)}><Icon size={14}/>{relatedLabel}</button>}{onDelete && <button className="society-icon-action society-delete-action" title="Delete record" onClick={() => onDelete(row)}>Delete</button>}</div></td></tr>)}</tbody></table></div> : <div className="society-empty"><Icon size={24}/><h3>No {title.toLowerCase()} found</h3><p>Add a record or adjust the search filter.</p>{onCreate && <button className="society-add-button" onClick={onCreate}>+ Add first record</button>}</div>}
    </section>;
}
