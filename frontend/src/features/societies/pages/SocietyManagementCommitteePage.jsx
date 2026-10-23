import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, CalendarDays, Camera, Edit2, ImagePlus, Mail, Phone, Plus, RefreshCw, Search, ShieldCheck, Trash2, UsersRound, X } from "lucide-react";
import { legacyApi } from "../../../lib/axios";
import useAuth from "../../../app/providers/useAuth";
import "./society-management-committee.css";

const ROLES = ["CHAIRPERSON", "VICE_CHAIRPERSON", "SECRETARY", "JOINT_SECRETARY", "TREASURER", "COMMITTEE_MEMBER", "OTHER"];
const EMPTY = { memberName: "", designation: "COMMITTEE_MEMBER", unitNumber: "", phone: "", email: "", termStart: "", termEnd: "", notes: "", isActive: true };
const pretty = (value) => String(value || "").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const errorMessage = (error) => error?.response?.data?.message || "Could not complete the committee request.";
const dateLabel = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "Not set";
const profileImageUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const apiBase = import.meta.env.VITE_LEGACY_API_BASE_URL || (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/api\/v1\/?$/, "/api");
  return new URL(value, new URL(apiBase, window.location.origin)).toString();
};

export default function SocietyManagementCommitteePage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("SOCIETY_COMMITTEE_CREATE");
  const canUpdate = hasPermission("SOCIETY_COMMITTEE_UPDATE");
  const canDelete = hasPermission("SOCIETY_COMMITTEE_DELETE");
  const [members, setMembers] = useState([]);
  const [society, setSociety] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [profilePicture, setProfilePicture] = useState(null);
  const [picturePreview, setPicturePreview] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await legacyApi.get("/society-management-committee");
      setMembers(Array.isArray(response.data?.data) ? response.data.data : []);
      setSociety(response.data?.society || null);
    } catch (requestError) { setError(errorMessage(requestError)); setMembers([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!formOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => { if (event.key === "Escape") setFormOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKey); };
  }, [formOpen]);
  useEffect(() => {
    if (!formOpen) { setPicturePreview(""); return undefined; }
    if (!profilePicture) { setPicturePreview(profileImageUrl(editing?.profilePictureUrl)); return undefined; }
    const previewUrl = URL.createObjectURL(profilePicture);
    setPicturePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [editing, formOpen, profilePicture]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return members.filter((member) => (status === "ALL" || Boolean(member.isActive) === (status === "ACTIVE")) && (!needle || [member.memberName, member.designation, member.unitNumber, member.phone, member.email].some((value) => String(value || "").toLowerCase().includes(needle))));
  }, [members, query, status]);
  const activeCount = members.filter((member) => member.isActive).length;
  const roleCount = new Set(members.filter((member) => member.isActive).map((member) => member.designation)).size;

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY }); setProfilePicture(null); setError(""); setFormOpen(true); };
  const openEdit = (member) => { setEditing(member); setForm({ ...EMPTY, ...member, termStart: member.termStart?.slice(0, 10) || "", termEnd: member.termEnd?.slice(0, 10) || "" }); setProfilePicture(null); setError(""); setFormOpen(true); };
  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const selectPicture = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) {
      setError("Choose a JPG, PNG, or WEBP image."); event.target.value = ""; return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("The profile picture must be 5 MB or smaller."); event.target.value = ""; return;
    }
    setError(""); setProfilePicture(file);
  };
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    const payload = new FormData();
    ["memberName", "designation", "unitNumber", "phone", "email", "termStart", "termEnd", "notes", "isActive"].forEach((key) => {
      const value = form[key];
      payload.append(key, typeof value === "boolean" ? String(value) : value || "");
    });
    if (profilePicture) payload.append("profilePicture", profilePicture);
    try {
      if (editing) await legacyApi.put(`/society-management-committee/${editing.id}`, payload, { headers: { "Content-Type": "multipart/form-data" } });
      else await legacyApi.post("/society-management-committee", payload, { headers: { "Content-Type": "multipart/form-data" } });
      setFormOpen(false); setMessage(editing ? "Committee member updated." : "Committee member added."); await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setSaving(false); }
  };
  const remove = async (member) => {
    if (!window.confirm(`Remove ${member.memberName} from the management committee?`)) return;
    setError(""); setMessage("");
    try { await legacyApi.delete(`/society-management-committee/${member.id}`); setMessage("Committee member removed."); await load(); }
    catch (requestError) { setError(errorMessage(requestError)); }
  };

  return <main className="society-dashboard committee-page">
    <header className="society-heading committee-heading">
      <div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> MANAGE SOCIETY <span className="committee-crumb">/ MANAGEMENT COMMITTEE</span></div><h1>Management committee</h1><p>{society?.name ? `Meet the elected representatives of ${society.name}.` : "Manage the people responsible for guiding your society."}</p></div>
      <div className="committee-heading-actions"><button type="button" className="society-refresh-button" onClick={load} disabled={loading}><RefreshCw size={15} /> Refresh</button>{canCreate && <button type="button" className="society-add-button" onClick={openCreate}><Plus size={17} /> Add member</button>}</div>
    </header>
    <section className="committee-banner"><span className="committee-banner-icon"><UsersRound size={22} /></span><div><span>YOUR COMMUNITY LEADERS</span><h2>{society?.name || "Society management committee"}</h2><p>A clear directory of office bearers, their responsibilities, and their current term.</p></div><Building2 className="committee-banner-mark" size={72} /></section>
    <section className="committee-summary" aria-label="Committee summary"><article><span className="purple"><UsersRound size={17} /></span><div><small>Committee members</small><strong>{loading ? "—" : members.length}</strong></div></article><article><span className="green"><ShieldCheck size={17} /></span><div><small>Currently serving</small><strong>{loading ? "—" : activeCount}</strong></div></article><article><span className="blue"><Building2 size={17} /></span><div><small>Roles represented</small><strong>{loading ? "—" : roleCount}</strong></div></article></section>
    {error && <div className="society-error" role="alert">{error}<button type="button" onClick={load}>Try again</button></div>}
    {message && <div className="society-success" role="status">{message}<button type="button" onClick={() => setMessage("")} aria-label="Dismiss"><X size={15} /></button></div>}
    <section className="committee-directory">
      <div className="committee-directory-head"><div><span>GOVERNANCE DIRECTORY</span><h2>Committee members</h2><p>Contact your society representatives and review their term details.</p></div><b>{loading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "member" : "members"}`}</b></div>
      <div className="committee-toolbar"><label className="committee-search"><Search size={17} /><input aria-label="Search committee members" placeholder="Search by name, role, unit, or contact…" value={query} onChange={(event) => setQuery(event.target.value)} /></label><div className="committee-filters" aria-label="Filter by service status">{[["ACTIVE", "Currently serving"], ["ALL", "All members"], ["FORMER", "Former members"]].map(([key, label]) => <button type="button" key={key} className={status === key ? "active" : ""} onClick={() => setStatus(key)}>{label}</button>)}</div></div>
      {loading ? <div className="committee-state">Loading committee members…</div> : filtered.length === 0 ? <div className="committee-empty"><span><UsersRound size={21} /></span><h3>{query || status !== "ACTIVE" ? "No matching members" : "Your committee directory is empty"}</h3><p>{query ? "Try a different name, role, or contact detail." : "Add the society’s office bearers to make their details easy to find."}</p>{canCreate && !query && <button type="button" className="society-add-button" onClick={openCreate}><Plus size={16} /> Add first member</button>}</div> : <div className="committee-grid">{filtered.map((member) => <article className={`committee-card role-${String(member.designation).toLowerCase()}`} key={member.id}>
        <div className="committee-card-top"><span className="committee-avatar">{member.profilePictureUrl ? <img src={profileImageUrl(member.profilePictureUrl)} alt={`${member.memberName} profile`} loading="lazy" /> : member.memberName?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><div className="committee-card-title"><span>{pretty(member.designation)}</span><strong className={member.isActive ? "serving" : "former"}>{member.isActive ? "Serving" : "Former"}</strong></div></div>
        <h3>{member.memberName}</h3>{member.unitNumber && <p className="committee-unit">Unit {member.unitNumber}</p>}
        <div className="committee-contact"><a href={`tel:${member.phone}`}><Phone size={15} />{member.phone}</a>{member.email && <a href={`mailto:${member.email}`}><Mail size={15} /><span>{member.email}</span></a>}</div>
        <div className="committee-term"><CalendarDays size={15} /><span>Term <b>{dateLabel(member.termStart)} – {dateLabel(member.termEnd)}</b></span></div>
        {member.notes && <p className="committee-notes">{member.notes}</p>}
        {(canUpdate || canDelete) && <div className="committee-card-actions">{canUpdate && <button type="button" onClick={() => openEdit(member)}><Edit2 size={14} /> Edit</button>}{canDelete && <button type="button" className="remove" onClick={() => remove(member)}><Trash2 size={14} /> Remove</button>}</div>}
      </article>)}</div>}
    </section>
    {formOpen && <div className="committee-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false); }}><section className="committee-dialog" role="dialog" aria-modal="true" aria-labelledby="committee-form-title"><div className="committee-dialog-head"><div><span>MANAGEMENT COMMITTEE</span><h2 id="committee-form-title">{editing ? "Edit member" : "Add committee member"}</h2><p>Keep office bearer and term information up to date.</p></div><button type="button" className="committee-close" onClick={() => setFormOpen(false)} aria-label="Close"><X size={17} /></button></div><form onSubmit={submit}><div className="committee-form-grid">
      <div className="committee-picture-field"><span className="committee-picture-preview">{picturePreview ? <img src={picturePreview} alt="Selected member profile preview" /> : <ImagePlus size={23} />}</span><label><strong>Profile picture</strong><small>JPG, PNG, or WEBP · Up to 5 MB</small><span className="committee-picture-button"><Camera size={14} />{profilePicture ? "Choose another photo" : picturePreview ? "Replace photo" : "Upload photo"}<input id="committee-profile-picture" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPicture} /></span></label>{profilePicture && <button type="button" className="committee-picture-clear" onClick={() => { setProfilePicture(null); const input = document.getElementById("committee-profile-picture"); if (input) input.value = ""; }}>Remove selection</button>}</div>
      <label>Full Name<input required maxLength={140} value={form.memberName} onChange={(event) => updateField("memberName", event.target.value)} placeholder="e.g. Ananya Deshmukh" /></label>
      <label>Committee role<select required value={form.designation} onChange={(event) => updateField("designation", event.target.value)}>{ROLES.map((role) => <option key={role} value={role}>{pretty(role)}</option>)}</select></label>
      <label>Unit number <span>Optional</span><input maxLength={40} value={form.unitNumber || ""} onChange={(event) => updateField("unitNumber", event.target.value)} placeholder="e.g. B-204" /></label>
      <label>Phone number<input required type="tel" maxLength={30} value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="e.g. +91 98765 43210" /></label>
      <label>Email address <span>Optional</span><input type="email" maxLength={255} value={form.email || ""} onChange={(event) => updateField("email", event.target.value)} placeholder="name@example.com" /></label>
      <label>Term starts <span>Optional</span><input type="date" value={form.termStart || ""} onChange={(event) => updateField("termStart", event.target.value)} /></label>
      <label>Term ends <span>Optional</span><input type="date" min={form.termStart || undefined} value={form.termEnd || ""} onChange={(event) => updateField("termEnd", event.target.value)} /></label>
      <label className="committee-wide">Notes <span>Optional</span><textarea rows="3" maxLength={2000} value={form.notes || ""} onChange={(event) => updateField("notes", event.target.value)} placeholder="Responsibilities or additional information" /></label>
      {editing && <label className="committee-active"><input type="checkbox" checked={Boolean(form.isActive)} onChange={(event) => updateField("isActive", event.target.checked)} /><span><b>Currently serving</b><small>Turn off when this member’s term has ended.</small></span></label>}
    </div>{error && <p className="committee-form-error" role="alert">{error}</p>}<div className="committee-dialog-actions"><button type="button" onClick={() => setFormOpen(false)}>Cancel</button><button className="primary" type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Add member"}</button></div></form></section></div>}
  </main>;
}
