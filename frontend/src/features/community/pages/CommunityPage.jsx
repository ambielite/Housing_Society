import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarDays, Check, ChevronRight, CircleAlert, FileText, MessageSquare, RefreshCw, Search, Shield, Users, X } from "lucide-react";
import communityApi from "../api/community.api";
import CommunityDashboard from "./CommunityDashboard";
import CommunityResourcePanel from "./CommunityResourcePanel";
import CommunityMembersDialog from "./CommunityMembersDialogV2";
import CommunityRecordForm from "./CommunityRecordForm";
import VotingManagementDialog from "./VotingManagementDialog";
import { useAuth } from "../../../app/providers/useAuth";

const sections = [
  ["dashboard", "Overview", Shield], ["groups", "Groups & members", Users], ["forums", "Forums & discussions", MessageSquare],
  ["classifieds", "Classifieds", FileText], ["events", "Events & RSVPs", CalendarDays], ["meetings", "Meetings", CalendarDays],
  ["governance", "AGM / SGM", FileText], ["moderation", "Moderation", CircleAlert], ["voting", "Voting & rules", Check]
];
const configs = {
  groups: { title: "Community groups", base: "/community-groups", create: true, fields: ["societyId", "name", "description", "category", "visibility", "status"], children: ["members"] },
  members: { title: "Group members", base: "/community-groups", fields: ["userId", "role"] },
  forums: { title: "Forums", base: "/community-forums", create: true, fields: ["societyId", "name", "description", "category", "visibility", "status"] },
  posts: { title: "Posts", base: "/community-posts", create: true, fields: ["forumId", "title", "content", "status"] },
  comments: { title: "Comments", base: "/community", create: true, fields: ["content"], endpoint: (row) => `/community/posts/${row.postId}/comments` },
  classifieds: { title: "Classifieds", base: "/community-classifieds", create: true, fields: ["societyId", "sellerId", "title", "description", "category", "price", "isNegotiable", "contactPhone", "contactEmail"] },
  events: { title: "Events", base: "/community-events", create: true, fields: ["societyId", "title", "description", "category", "venue", "startAt", "endAt", "capacity", "isFree", "ticketPrice"] },
  rsvps: { title: "Event RSVP", base: "/community-events/rsvps", fields: ["userId", "totalTickets", "guestCount"] },
  meetings: { title: "Meetings", base: "/community-meetings", create: true, fields: ["societyId", "title", "description", "meetingType", "scheduledAt", "endAt", "venue", "meetingLink"] },
  agendas: { title: "Agendas", base: "/community-meeting-agendas", create: true, fields: ["meetingId", "title", "description", "agendaOrder", "discussionRequired", "decisionRequired"] },
  attendance: { title: "Attendance", base: "/community-meeting-attendance", create: true, fields: ["meetingId", "userId", "attendanceStatus", "remarks"] },
  minutes: { title: "Minutes", base: "/community-meeting-minutes", create: true, fields: ["meetingId", "preparedBy", "summary", "discussionSummary"] },
  actions: { title: "Action items", base: "/community-meeting-action-items", create: true, fields: ["meetingId", "agendaId", "title", "description", "assignedTo", "priority", "dueDate"] },
  governance: { title: "AGM & SGM", base: "/community-governance", create: true, fields: ["societyId", "meetingId", "governanceType", "meetingNumber", "financialYear", "noticeDate", "noticePeriodDays", "quorumRequired", "chairmanId", "secretaryId"] },
  moderation: { title: "Moderation queue", base: "/community-moderation", fields: ["reporterId", "contentType", "contentId", "reason", "description"] },
  voting: { title: "Voting records", base: "/community-voting", create: true, fields: ["societyId", "governanceMeetingId", "title", "description", "votingType", "ballotType", "secrecy", "startAt", "endAt", "quorumRequired", "legalBasis", "eligibilityRules", "candidateApprovalRequired", "identityVerificationRequired", "otpRequired"] },
  rules: { title: "Governance rules", base: "/community-voting/rules", create: true, list: () => `/community-voting/rules/society/${localStorage.getItem("selectedSocietyId") || ""}`, fields: ["societyId", "ruleCode", "ruleName", "ruleType", "configuration", "effectiveFrom", "effectiveTo", "isActive"] }
};
const rowsFrom = (r) => { let d = r?.data ?? r; if (Array.isArray(d)) return d; return d?.rows || d?.records || d?.items || d?.data || []; };
const idOf = (r) => r?.id ?? r?.uuid ?? r?._id;
const titleOf = (r) => r?.title || r?.name || r?.subject || r?.id || "Community record";
const selectedSocietyId = () => String(localStorage.getItem("selectedSocietyId") || "").replace(/^:+/, "").trim();
const currentUserId = () => { try { const user = JSON.parse(localStorage.getItem("user") || "{}"); return user.id || user.userId || user.user?.id || user.data?.id || ""; } catch { return ""; } };
const actions = {
  groups: [["activate", "Activate"], ["deactivate", "Deactivate"]], forums: [["activate", "Activate"], ["deactivate", "Deactivate"]],
  posts: [["pin", "Pin"], ["unpin", "Unpin"], ["lock", "Lock"], ["unlock", "Unlock"]],
  classifieds: [["submit", "Submit for review"], ["approve", "Approve"], ["reject", "Reject"], ["publish", "Publish"], ["sold", "Mark sold"], ["remove", "Remove"], ["expire", "Expire"]],
  events: [["submit", "Submit"], ["approve", "Approve"], ["publish", "Publish"], ["cancel", "Cancel"], ["complete", "Complete"]],
  meetings: [["submit", "Submit"], ["approve", "Approve"], ["schedule", "Schedule"], ["start", "Start"], ["complete", "Complete"], ["cancel", "Cancel"]],
  governance: [["publish-notice", "Publish notice"], ["schedule", "Schedule"], ["start", "Start"], ["quorum", "Update quorum"], ["complete", "Complete"], ["approve-minutes", "Approve minutes"], ["cancel", "Cancel"]],
  moderation: [["review", "Start review"], ["action", "Apply action"], ["resolve", "Resolve"], ["dismiss", "Dismiss"]],
  rsvps: [["cancel", "Cancel RSVP"], ["payment-paid", "Mark paid"], ["payment-failed", "Payment failed"], ["check-in", "Check in"], ["no-show", "Mark no-show"]],
  attendance: [["check-out", "Check out"]], minutes: [["submit", "Submit"], ["approve", "Approve"], ["reject", "Reject"]],
  agendas: [["status", "Update status"]], actions: [["start", "Start"], ["complete", "Complete"], ["cancel", "Cancel"]],
  // Ballot actions stay unavailable until eligibility, quorum, secrecy and audit rules are approved.
};
const workflowActionsFor = (key, row) => {
  if (key === "voting") {
    const status = String(row.status || "DRAFT").toUpperCase();
    if (status === "DRAFT") {
      const next = !row.rulesApproved ? ["approve-rules", "Approve rules"] : new Date(row.startAt) > new Date() ? ["schedule", "Schedule"] : ["open", "Open ballot"];
      return [next, ["cancel", "Cancel"]];
    }
    if (status === "SCHEDULED") return [["cancel", "Cancel"]];
    if (status === "OPEN") return [["close", "Close ballot"], ["cancel", "Cancel"]];
    if (status === "CLOSED") return [["count", "Count votes"]];
    if (status === "RESULT_DECLARED" && !row.resultsPublishedAt) return [["publish-results", "Publish results"]];
    return [];
  }
  if (key === "events") {
    const nextAction = {
      DRAFT: ["submit", "Submit"],
      PENDING_APPROVAL: ["approve", "Approve"],
      APPROVED: ["publish", "Publish"],
      PUBLISHED: ["complete", "Complete"],
    }[String(row.status || "").toUpperCase()];
    return [...(nextAction ? [nextAction] : []), ...(!["COMPLETED", "CANCELLED"].includes(String(row.status || "").toUpperCase()) ? [["cancel", "Cancel"]] : [])];
  }
  if (key === "meetings") {
    const nextAction = {
      DRAFT: ["submit", "Submit"],
      PENDING_APPROVAL: ["approve", "Approve"],
      APPROVED: ["schedule", "Schedule"],
      SCHEDULED: ["start", "Start"],
      IN_PROGRESS: ["complete", "Complete"],
    }[String(row.status || "").toUpperCase()];
    return [...(nextAction ? [nextAction] : []), ...(!["COMPLETED", "CANCELLED"].includes(String(row.status || "").toUpperCase()) ? [["cancel", "Cancel"]] : [])];
  }
  if (key === "governance") {
    const status = String(row.status || "").toUpperCase();
    let nextAction;
    if (status === "DRAFT") nextAction = ["publish-notice", "Publish notice"];
    else if (status === "NOTICE_PUBLISHED") nextAction = ["schedule", "Schedule"];
    else if (status === "SCHEDULED") nextAction = ["start", "Start"];
    else if (status === "IN_PROGRESS") {
      nextAction = Number(row.quorumRequired || 0) > 0 && !row.quorumReached
        ? ["quorum", "Update quorum"]
        : ["complete", "Complete"];
    } else if (status === "QUORUM_CONFIRMED") nextAction = ["complete", "Complete"];
    else if (status === "MINUTES_PENDING") nextAction = ["approve-minutes", "Approve minutes"];
    const canCancel = !["COMPLETED", "MINUTES_PENDING", "MINUTES_APPROVED", "CANCELLED"].includes(status);
    return [...(nextAction ? [nextAction] : []), ...(canCancel ? [["cancel", "Cancel"]] : [])];
  }
  return actions[key] || [];
};

export default function CommunityPage() {
  const { user } = useAuth();
  const { section = "dashboard" } = useParams();
  const [tab, setTab] = useState(section === "overview" ? "dashboard" : section); const [data, setData] = useState({}); const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [search, setSearch] = useState(""); const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({}); const [busy, setBusy] = useState(false);
  const [memberGroup, setMemberGroup] = useState(null);
  const [cancellationTarget, setCancellationTarget] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [votingManage, setVotingManage] = useState(null);
  const [lookups, setLookups] = useState({ societies: [], residents: [] });
  useEffect(() => setTab(section === "overview" ? "dashboard" : section), [section]);
  useEffect(() => {
    const societyId = selectedSocietyId();
    Promise.allSettled([communityApi.get("/societies"), communityApi.get("/residents", societyId ? { params: { societyId } } : undefined)]).then(([societiesResult, residentsResult]) => {
      setLookups({ societies: societiesResult.status === "fulfilled" ? rowsFrom(societiesResult.value) : [], residents: residentsResult.status === "fulfilled" ? rowsFrom(residentsResult.value) : [] });
    });
  }, []);
  const loadResidents = async (societyId) => {
    try { const residents = await communityApi.get("/residents", societyId ? { params: { societyId } } : undefined); setLookups((current) => ({ ...current, residents: rowsFrom(residents) })); }
    catch { setLookups((current) => ({ ...current, residents: [] })); }
  };
  const load = async () => {
    setLoading(true); setError("");
    const keys = Object.keys(configs).filter((key) => !["agendas", "minutes", "comments", "members"].includes(key)); const results = await Promise.allSettled(keys.map((key) => communityApi.get(typeof configs[key].list === "function" ? configs[key].list() : configs[key].base)));
    const next = {}; const failed = [];
    results.forEach((r, i) => { next[keys[i]] = r.status === "fulfilled" ? rowsFrom(r.value) : []; if (r.status === "rejected") { const reason = r.reason; const detail = reason?.response?.data?.message || reason?.message; failed.push(`${configs[keys[i]].title}${detail ? ` (${reason?.response?.status || "request failed"}: ${detail})` : ""}`); } });
    const communityMeetings = next.meetings || [];
    next.governance = (next.governance || []).map((record) => {
      const meeting = communityMeetings.find((item) => String(idOf(item)) === String(record.meetingId));
      return {
        ...record,
        meetingType: record.governanceType || meeting?.meetingType || record.meetingType,
        scheduledAt: meeting?.scheduledAt || record.scheduledAt,
      };
    });
    next.agendas = []; next.minutes = [];
    const meetingResults = await Promise.allSettled((next.meetings || []).map(async (meeting) => {
      const meetingId = idOf(meeting);
      const [agendas, minutes] = await Promise.allSettled([communityApi.get(`/community-meeting-agendas/meeting/${meetingId}`), communityApi.get(`/community-meeting-minutes/meeting/${meetingId}`)]);
      if (agendas.status === "fulfilled") next.agendas.push(...rowsFrom(agendas.value));
      if (minutes.status === "fulfilled") next.minutes.push(...rowsFrom(minutes.value));
    }));
    if (meetingResults.some((result) => result.status === "rejected")) failed.push("meeting details");
    setData(next); const visibleFailures = tab === "dashboard" || tab === "events" ? failed : failed.filter((name) => name !== "Event RSVPs"); if (visibleFailures.length) setError(`Some records could not load: ${visibleFailures.join(", ")}.`); else setError(""); setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const activeKeys = useMemo(() => tab === "dashboard" ? [] : tab === "forums" ? ["forums", "posts"] : tab === "events" ? ["events", "rsvps"] : tab === "meetings" ? ["meetings", "agendas", "attendance", "minutes", "actions"] : tab === "governance" ? ["governance", "voting", "rules"] : tab === "voting" ? ["voting", "rules"] : [tab], [tab]);
  const recordCount = activeKeys.reduce((total, key) => total + (data[key] || []).length, 0);
  const formOptions = { ...lookups, forums: data.forums || [], meetings: data.meetings || [], governanceMeetings: data.governance || [], agendas: data.agendas || [], events: data.events || [] };
  const openCreate = (key, extra = {}) => { setError(""); setNotice(""); setForm({ societyId: selectedSocietyId(), ...extra }); setDialog({ key }); };
  const run = async (callback) => { setBusy(true); setError(""); setNotice(""); try { const result = await callback(); if (result === false) return; await load(); setDialog(null); setNotice("Changes saved."); } catch (e) { setError(e.response?.data?.message || e.message || "Could not complete the request."); } finally { setBusy(false); } };
  const act = (key, row, action) => run(async () => { let payload = {};
    if (key === "governance" && action === "publish-notice") {
      const noticeDate = window.prompt("Notice date (YYYY-MM-DD):", new Date().toISOString().slice(0, 10));
      if (noticeDate === null) return false;
      payload = { noticeDate: noticeDate.trim() };
    } else if (key === "governance" && action === "quorum") {
      const eligible = window.prompt("Number of eligible members:", String(row.eligibleMemberCount ?? ""));
      if (eligible === null) return false;
      const present = window.prompt("Number of members present:", String(row.presentMemberCount ?? ""));
      if (present === null) return false;
      const eligibleMemberCount = Number(eligible); const presentMemberCount = Number(present);
      if (!Number.isInteger(eligibleMemberCount) || !Number.isInteger(presentMemberCount) || eligibleMemberCount < 0 || presentMemberCount < 0 || presentMemberCount > eligibleMemberCount) throw new Error("Enter valid member counts; present members cannot exceed eligible members.");
      payload = { eligibleMemberCount, presentMemberCount };
    } else if (["reject", "action", "status"].includes(action) || (key === "voting" && action === "cancel")) {
      const text = window.prompt(action === "status" ? "Enter agenda status" : key === "voting" && action === "cancel" ? "Enter a reason for cancelling this voting record" : "Add a note or reason");
      if (text === null) return false;
      payload = action === "status" ? { status: text } : { reason: text.trim() };
      if (!text.trim()) throw new Error("A reason is required.");
    }
    if (action === "approve" && ["events", "meetings", "minutes"].includes(key)) {
      const approverId = user?.id || user?.userId || user?.user?.id || currentUserId();
      if (!approverId) throw new Error("Could not identify the signed-in user. Sign in again and retry.");
      payload.approvedBy = approverId;
    }
    await communityApi.post(`${configs[key].base}/${idOf(row)}/${action}`, payload); });
  const remove = (key, row) => { if (!window.confirm("Delete this record permanently?")) return; const endpoint = key === "comments" ? `/community/posts/${row.postId || idOf(dialog?.parent)}/comments/${idOf(row)}` : `${configs[key].base}/${idOf(row)}`; run(() => communityApi.delete(endpoint)); };
  const saveDialog = async () => {
    const key = dialog.key; const payload = { ...form }; let endpoint = configs[key].base;
    Object.keys(payload).forEach((name) => { if (payload[name] === "") delete payload[name]; else if (["price", "ticketPrice", "capacity", "totalTickets", "guestCount", "agendaOrder", "noticePeriodDays", "quorumRequired"].includes(name)) payload[name] = Number(payload[name]); else if (["isFree", "isNegotiable", "isActive", "discussionRequired", "decisionRequired", "candidateApprovalRequired", "identityVerificationRequired", "otpRequired"].includes(name)) payload[name] = payload[name] === "true"; });
    if (["posts", "comments", "attendance", "rsvps"].includes(key)) payload.userId = payload.userId || currentUserId();
    if (["events", "meetings", "groups", "forums", "governance", "rules"].includes(key) && currentUserId()) payload.createdBy = currentUserId();
    if (key === "rules" && typeof payload.configuration === "string") payload.configuration = JSON.parse(payload.configuration || "{}");
    if (key === "voting" && typeof payload.eligibilityRules === "string") payload.eligibilityRules = JSON.parse(payload.eligibilityRules || "{}");
    if (key === "voting") {
      for (const field of ["startAt", "endAt"]) {
        if (payload[field]) payload[field] = new Date(payload[field]).toISOString();
      }
    }
    if (dialog.parent && key === "comments") { payload.postId = idOf(dialog.parent); endpoint = `/community/posts/${idOf(dialog.parent)}/comments`; }
    if (dialog.parent && key === "rsvps") { payload.eventId = idOf(dialog.parent); payload.societyId = dialog.parent.societyId; endpoint = `/community-events/events/${idOf(dialog.parent)}/rsvp`; }
    await communityApi.post(endpoint, payload);
  };
  const openComments = async (post) => { setForm({}); setDialog({ key: "comments", parent: post }); try { const response = await communityApi.get(`/community/posts/${idOf(post)}/comments`); setData((old) => ({ ...old, comments: rowsFrom(response) })); } catch (e) { setError(e.response?.data?.message || "Could not load comments."); } };
  const filtered = (key) => (data[key] || []).filter((r) => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));
  const resourceTab = (key) => <CommunityResourcePanel resource={key} title={key === "voting" ? "Voting records and drafts" : configs[key].title} rows={filtered(key)} loading={loading} onCreate={configs[key].create ? () => openCreate(key) : null} onAction={(row) => workflowActionsFor(key, row).map(([action, label]) => ({ label, run: () => (["events", "meetings", "governance", "voting"].includes(key) && action === "cancel") ? (setCancellationReason(""), setCancellationTarget({ key, row })) : act(key, row, action) }))} onDelete={key === "voting" ? null : (row) => remove(key, row)} relatedLabel={key === "posts" ? "Comments" : key === "events" ? "RSVP" : key === "voting" ? "Manage voting" : "Manage members"} onOpenRelated={key === "posts" ? openComments : key === "events" ? (row) => { setForm({}); setDialog({ key: "rsvps", parent: row }); } : key === "groups" ? setMemberGroup : key === "voting" ? setVotingManage : null} />;
  const submitEventCancellation = async (event) => {
    event.preventDefault();
    const reason = cancellationReason.trim();
    if (!reason || !cancellationTarget) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await communityApi.post(`${configs[cancellationTarget.key].base}/${idOf(cancellationTarget.row)}/cancel`, cancellationTarget.key === "voting" ? { reason } : { cancellationReason: reason });
      const cancelledType = cancellationTarget.key === "events" ? "Event" : cancellationTarget.key === "governance" ? "AGM / SGM" : cancellationTarget.key === "voting" ? "Voting" : "Meeting";
      setCancellationTarget(null); setCancellationReason("");
      await load();
      setNotice(`${cancelledType} cancelled.`);
    } catch (e) {
      setError(e.response?.data?.message || "Could not cancel the record.");
    } finally { setBusy(false); }
  };
  return <main className="society-dashboard assets-page community-page"><header className="society-heading"><div><div className="society-eyebrow">SOCIETY OPERATIONS <ChevronRight size={12}/> COMMUNITY</div><h1>Community & governance</h1><p>Bring resident groups, conversations, events and society decisions into one workspace.</p></div><button className="society-add-button" onClick={load}><RefreshCw size={16}/> Refresh</button></header>
    <nav className="security-tabs assets-tabs" aria-label="Community sections">{sections.map(([key, label, Icon]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => { setTab(key); setSearch(""); setError(""); setNotice(""); }}><Icon size={16}/>{label}</button>)}</nav>
    {(error || notice) && <div className={error ? "society-error" : "society-list-panel"}>{error || notice}</div>}
    {tab === "dashboard" && <CommunityDashboard data={data} loading={loading} onNavigate={setTab} onCreate={(key) => openCreate(key)} />}
    {tab !== "dashboard" && <div className="society-toolbar"><label className="society-search"><Search size={17}/><input aria-label="Search community records" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search records"/></label><span className="society-count">{loading ? "Loading" : `${recordCount} ${recordCount === 1 ? "record" : "records"}`}</span></div>}
    {tab === "voting" && <aside className="community-compliance-note" role="note"><span className="community-compliance-icon"><CircleAlert size={18}/></span><div><strong>Voting setup is available; opening a ballot is approval-gated</strong><p>You can prepare draft voting records and governance rules. Opening a ballot, issuing ballots, accepting votes, and tallying require formally approved eligibility, quorum, ballot secrecy, and audit requirements.</p></div></aside>}
    {tab !== "overview" && activeKeys.map((key) => configs[key] && resourceTab(key))}
    {dialog && <div className="society-modal-layer" onMouseDown={(event) => event.target === event.currentTarget && setDialog(null)}><section className="society-form-modal security-record-modal community-record-modal" role="dialog" aria-modal="true" aria-labelledby="community-record-title"><header className="society-form-header"><div><span className="society-eyebrow">COMMUNITY WORKSPACE</span><h2 id="community-record-title">{dialog.key === "comments" ? `Comment on ${titleOf(dialog.parent)}` : configs[dialog.key]?.title}</h2><p>Complete the details below to save this record.</p></div><button type="button" className="modal-close-btn" aria-label="Close" onClick={() => setDialog(null)}><X size={18} aria-hidden="true" /></button></header>
      {error && <p className="security-form-error" role="alert">{error}</p>}
      {dialog.key === "comments" && <div className="community-comments-list">{(data.comments || []).map((comment) => <article key={idOf(comment)}><strong>{comment.authorName || comment.authorId || "Resident"}</strong><p>{comment.content}</p><button type="button" className="society-workflow-action" onClick={() => remove("comments", comment)}>Delete</button></article>)}{!(data.comments || []).length && <p>No comments yet. Start the conversation below.</p>}</div>}
      <form onSubmit={(event) => { event.preventDefault(); run(saveDialog); }}><div className="society-form-body community-record-body"><CommunityRecordForm resource={dialog.key} fields={configs[dialog.key]?.fields || []} value={form} options={formOptions} onChange={setForm} onSocietyChange={loadResidents}/></div><footer className="society-form-footer"><button type="button" className="btn-secondary" onClick={() => setDialog(null)}>Cancel</button><button type="submit" className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save record"}</button></footer></form>
    </section></div>}
    {cancellationTarget && <div className="society-modal-layer" onMouseDown={(event) => event.target === event.currentTarget && !busy && setCancellationTarget(null)}><section className="society-form-modal community-record-modal" role="dialog" aria-modal="true" aria-labelledby="record-cancel-title"><header className="society-form-header"><div><span className="society-eyebrow">{cancellationTarget.key === "events" ? "EVENT" : cancellationTarget.key === "governance" ? "AGM / SGM" : cancellationTarget.key === "voting" ? "VOTING" : "MEETING"} MANAGEMENT</span><h2 id="record-cancel-title">Cancel {titleOf(cancellationTarget.row)}?</h2><p>Enter a reason for cancelling this {cancellationTarget.key === "events" ? "event" : cancellationTarget.key === "governance" ? "AGM / SGM" : cancellationTarget.key === "voting" ? "voting record" : "meeting"}.</p></div><button type="button" className="modal-close-btn" aria-label="Close" disabled={busy} onClick={() => setCancellationTarget(null)}><X size={18} aria-hidden="true" /></button></header><form onSubmit={submitEventCancellation}><div className="society-form-body community-record-body community-cancel-body"><label htmlFor="record-cancellation-reason">Cancellation reason</label><textarea id="record-cancellation-reason" value={cancellationReason} onChange={(event) => setCancellationReason(event.target.value)} rows={4} maxLength={1000} required autoFocus placeholder="Explain why this record is being cancelled" /></div><footer className="society-form-footer"><button type="button" className="btn-secondary" disabled={busy} onClick={() => setCancellationTarget(null)}>Keep {cancellationTarget.key === "events" ? "event" : cancellationTarget.key === "governance" ? "AGM / SGM" : cancellationTarget.key === "voting" ? "vote" : "meeting"}</button><button type="submit" className="btn-primary" disabled={busy || !cancellationReason.trim()}>{busy ? "Cancelling…" : "Confirm cancellation"}</button></footer></form></section></div>}
    {memberGroup && <CommunityMembersDialog group={memberGroup} residents={lookups.residents} onClose={() => setMemberGroup(null)} onChanged={load}/>}
    {votingManage && <VotingManagementDialog voting={votingManage} onClose={() => setVotingManage(null)} onChanged={load}/>}
  </main>;
}

