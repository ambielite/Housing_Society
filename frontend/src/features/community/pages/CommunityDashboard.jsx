import { ArrowUpRight, CalendarDays, CircleAlert, ClipboardList, MessageSquare, Plus, Users } from "lucide-react";

const rows = (value) => Array.isArray(value) ? value : [];
const idOf = (record) => record?.id ?? record?.uuid ?? record?._id;
const titleOf = (record) => record?.title || record?.name || record?.subject || "Untitled";
const dateOf = (record) => record?.startDateTime || record?.scheduledAt || record?.eventDate || record?.startAt || record?.createdAt;
const dateLabel = (value) => value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "Date not set";
const isOpen = (record) => !["RESOLVED", "DISMISSED", "CLOSED", "COMPLETE", "COMPLETED", "CANCELLED"].includes(String(record?.status || "").toUpperCase());

export default function CommunityDashboard({ data = {}, loading, onNavigate, onCreate }) {
    const today = new Date();
    const events = rows(data.events).filter((event) => isOpen(event) && dateOf(event) && new Date(dateOf(event)) >= today).sort((a, b) => new Date(dateOf(a)) - new Date(dateOf(b))).slice(0, 4);
    const moderation = rows(data.moderation).filter(isOpen).slice(0, 4);
    const meetings = rows(data.meetings).filter((meeting) => isOpen(meeting) && dateOf(meeting)).sort((a, b) => new Date(dateOf(a)) - new Date(dateOf(b))).slice(0, 3);
    const posts = rows(data.posts).slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 4);
    const actions = rows(data.actions).filter(isOpen).slice(0, 4);
    const cards = [
        ["groups", "Resident groups", data.groups, Users], ["posts", "Forum posts", data.posts, MessageSquare],
        ["events", "Upcoming events", events, CalendarDays], ["moderation", "Needs review", moderation, CircleAlert]
    ];

    return <div>
        <div className="society-stats">{cards.map(([key, label, values, Icon]) => <article className="society-stat-card" key={key}><span className="society-stat-icon society-stat-icon-blue"><Icon size={18}/></span><div><span className="society-stat-label">{label}</span><strong>{loading ? "—" : rows(values).length}</strong></div></article>)}</div>

        <section className="society-list-panel">
            <div className="society-list-heading"><div><h2>Quick access</h2><p>Jump to a community workspace or start a new record.</p></div></div>
            <div className="society-lifecycle-grid">{[
                ["groups", "Groups & members", Users, "groups"], ["forums", "Forums & posts", MessageSquare, "posts"],
                ["classifieds", "Classifieds", ClipboardList, "classifieds"], ["events", "Plan an event", CalendarDays, "events"],
                ["meetings", "Meetings & actions", ClipboardList, "meetings"], ["governance", "AGM / SGM", Users, "governance"]
            ].map(([key, label, Icon, createKey]) => <button type="button" className="assets-quick-card" key={key} onClick={() => key === "events" ? onCreate?.(createKey) : onNavigate?.(key)}><Icon size={19}/><span>{label}</span><ArrowUpRight size={16}/></button>)}</div>
        </section>

        <div className="community-dashboard-grid">
            <section className="society-list-panel"><div className="society-list-heading"><div><h2>Upcoming events</h2><p>Next community events on the calendar.</p></div><button className="society-workflow-action" onClick={() => onNavigate?.("events")}>View all</button></div>
                {events.length ? <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Event</th><th>When</th><th>Status</th></tr></thead><tbody>{events.map((event) => <tr key={idOf(event)}><td>{titleOf(event)}</td><td>{dateLabel(dateOf(event))}</td><td>{event.status || "Scheduled"}</td></tr>)}</tbody></table></div> : <div className="society-empty"><CalendarDays size={22}/><h3>No upcoming events</h3><p>Create an event to bring residents together.</p><button className="society-add-button" onClick={() => onCreate?.("events")}><Plus size={16}/> Create event</button></div>}
            </section>
            <section className="society-list-panel"><div className="society-list-heading"><div><h2>Moderation queue</h2><p>Reports that may need committee attention.</p></div><button className="society-workflow-action" onClick={() => onNavigate?.("moderation")}>Review queue</button></div>
                {moderation.length ? <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Report</th><th>Reason</th><th>Status</th></tr></thead><tbody>{moderation.map((item) => <tr key={idOf(item)}><td>{titleOf(item)}</td><td>{item.reason || item.reportType || "Community report"}</td><td>{item.status || "Open"}</td></tr>)}</tbody></table></div> : <div className="society-empty"><CircleAlert size={22}/><h3>Queue is clear</h3><p>New reports will appear here for review.</p></div>}
            </section>
            <section className="society-list-panel"><div className="society-list-heading"><div><h2>Meetings & action items</h2><p>Upcoming meetings and work still in progress.</p></div><button className="society-workflow-action" onClick={() => onNavigate?.("meetings")}>Open meetings</button></div>
                <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Item</th><th>Due / scheduled</th><th>Status</th></tr></thead><tbody>{[...meetings.map((m) => ({ ...m, dashboardKind: "Meeting" })), ...actions.map((a) => ({ ...a, dashboardKind: "Action", dashboardDate: a.dueDate }))].slice(0, 5).map((item) => <tr key={`${item.dashboardKind}-${idOf(item)}`}><td><strong>{item.dashboardKind}:</strong> {titleOf(item)}</td><td>{dateLabel(item.dashboardDate || dateOf(item))}</td><td>{item.status || "Open"}</td></tr>)}</tbody></table></div>
                {!meetings.length && !actions.length && <div className="society-empty"><ClipboardList size={22}/><h3>No open meeting work</h3><p>Meeting schedules and action items will show here.</p></div>}
            </section>
            <section className="society-list-panel"><div className="society-list-heading"><div><h2>Recent discussions</h2><p>Latest posts shared in community forums.</p></div><button className="society-workflow-action" onClick={() => onNavigate?.("forums")}>Open forums</button></div>
                {posts.length ? <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Post</th><th>Author</th><th>Posted</th></tr></thead><tbody>{posts.map((post) => <tr key={idOf(post)}><td>{titleOf(post)}</td><td>{post.authorName || post.authorId || "Resident"}</td><td>{dateLabel(post.createdAt)}</td></tr>)}</tbody></table></div> : <div className="society-empty"><MessageSquare size={22}/><h3>No discussions yet</h3><p>Posts from resident forums will appear here.</p><button className="society-add-button" onClick={() => onNavigate?.("forums")}><Plus size={16}/> Open forums</button></div>}
            </section>
        </div>
        <section className="society-list-panel"><div className="society-list-heading"><div><h2>Governance controls</h2><p>E-voting remains unavailable until eligibility, quorum, ballot secrecy, and audit requirements are formally approved.</p></div><button className="society-workflow-action" onClick={() => onNavigate?.("governance")}>AGM / SGM workflows</button></div></section>
    </div>;
}
