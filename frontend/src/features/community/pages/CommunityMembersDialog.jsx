import { useEffect, useState } from "react";
import { Plus, Users, X } from "lucide-react";
import communityApi from "../api/community.api";

const rowsFrom = (value) => Array.isArray(value) ? value : value?.data || value?.records || [];
const idOf = (value) => value?.id ?? value?.uuid ?? value?._id;

export default function CommunityMembersDialog({ group, residents = [], onClose, onChanged }) {
    const [members, setMembers] = useState([]); const [form, setForm] = useState({ userId: "", role: "MEMBER" });
    const [editing, setEditing] = useState(null); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
    const base = `/community-groups/${idOf(group)}/members`;
    const load = async () => { setLoading(true); try { setMembers(rowsFrom(await communityApi.get(base))); setError(""); } catch (e) { setError(e.response?.data?.message || "Could not load this group's members."); } finally { setLoading(false); } };
    useEffect(() => { load(); }, [group?.id]);
    const save = async (event) => { event.preventDefault(); setBusy(true); setError(""); try { if (editing) await communityApi.put(`${base}/${idOf(editing)}`, form); else await communityApi.post(base, form); setForm({ userId: "", role: "MEMBER" }); setEditing(null); await load(); onChanged?.(); } catch (e) { setError(e.response?.data?.message || "Could not save the group member."); } finally { setBusy(false); } };
    const remove = async (member) => { if (!window.confirm("Remove this member from the group?")) return; setBusy(true); try { await communityApi.post(`${base}/${idOf(member)}/remove`); await load(); onChanged?.(); } catch (e) { setError(e.response?.data?.message || "Could not remove this member."); } finally { setBusy(false); } };

    return <div className="society-modal-layer" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="society-form-modal security-record-modal" role="dialog" aria-modal="true" aria-labelledby="community-members-title"><header className="security-modal-header"><div><h2 id="community-members-title">{group?.name || "Group"} members</h2><p>Manage membership and roles for this resident group.</p></div><button type="button" aria-label="Close members" onClick={onClose}><X size={19}/></button></header>
        {error && <div className="society-error" role="alert">{error}</div>}
        {loading ? <div className="society-loading">Loading members…</div> : members.length ? <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Resident</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>{members.map((member) => <tr key={idOf(member)}><td>{member.user?.fullName || member.user?.name || member.userName || member.userId}</td><td>{member.role || "Member"}</td><td>{member.status || "Active"}</td><td><div className="society-row-actions"><button className="society-workflow-action" onClick={() => { setEditing(member); setForm({ userId: member.userId || "", role: member.role || "MEMBER" }); }}>Edit</button><button className="society-icon-action society-delete-action" disabled={busy} onClick={() => remove(member)}>Remove</button></div></td></tr>)}</tbody></table></div> : <div className="society-empty"><Users size={23}/><h3>No members yet</h3><p>Add residents to get this group started.</p></div>}
        <form onSubmit={save}><div className="society-form-body"><div className="form-grid"><label className="form-group">User ID<input required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}/></label><label className="form-group">Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="MEMBER">Member</option><option value="ADMIN">Admin</option><option value="MODERATOR">Moderator</option></select></label></div></div><footer className="society-form-footer"><button type="button" className="btn-secondary" onClick={() => { setEditing(null); setForm({ userId: "", role: "MEMBER" }); }}>Clear</button><button type="submit" className="btn-primary" disabled={busy}>{busy ? "Saving…" : editing ? "Save member" : <><Plus size={15}/> Add member</>}</button></footer></form>
    </section></div>;
}
