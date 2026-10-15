import { useEffect, useState } from "react";
import { X } from "lucide-react";
import communityApi from "../api/community.api";
import CommunityRecordForm from "./CommunityRecordForm";

const rowsFrom = (value) => Array.isArray(value) ? value : value?.data || value?.rows || value?.records || [];
const idOf = (value) => value?.id ?? value?.uuid ?? value?._id;

export default function CommunityMembersDialog({ group, residents = [], onClose, onChanged }) {
    const [members, setMembers] = useState([]);
    const [form, setForm] = useState({ role: "MEMBER" });
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const base = `/community-groups/${idOf(group)}/members`;

    const load = async () => {
        setLoading(true);
        try { setMembers(rowsFrom(await communityApi.get(base))); setError(""); }
        catch (requestError) { setError(requestError.response?.data?.message || "Could not load this group's members."); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, [group?.id]);

    const save = async (event) => {
        event.preventDefault(); setBusy(true); setError("");
        try {
            if (editing) await communityApi.put(`${base}/${idOf(editing)}`, form);
            else await communityApi.post(base, form);
            setEditing(null); setForm({ role: "MEMBER" }); await load(); onChanged?.();
        } catch (requestError) { setError(requestError.response?.data?.message || "Could not save the group member."); }
        finally { setBusy(false); }
    };
    const remove = async (member) => {
        if (!window.confirm("Remove this member from the group?")) return;
        setBusy(true);
        try { await communityApi.post(`${base}/${idOf(member)}/remove`); await load(); onChanged?.(); }
        catch (requestError) { setError(requestError.response?.data?.message || "Could not remove the group member."); }
        finally { setBusy(false); }
    };
    const residentLabel = (resident) => resident.displayName || [resident.firstName, resident.middleName, resident.lastName].filter(Boolean).join(" ") || resident.user?.name || resident.id;

    return <div className="society-modal-layer" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
        <section className="society-form-modal security-record-modal" role="dialog" aria-modal="true" aria-labelledby="community-members-title">
            <header className="security-modal-header"><div><div className="society-eyebrow">COMMUNITY GROUP</div><h2 id="community-members-title">{group?.name || "Group"} members</h2><p>Assign residents to this group and manage their roles.</p></div><button type="button" aria-label="Close" onClick={onClose}><X size={18}/></button></header>
            {error && <p className="security-form-error" role="alert">{error}</p>}
            {loading ? <div className="society-loading">Loading members...</div> : members.length ? <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Resident</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>{members.map((member) => <tr key={idOf(member)}><td>{member.user?.fullName || member.user?.name || residents.find((resident) => String(resident.userId || resident.id) === String(member.userId)) && residentLabel(residents.find((resident) => String(resident.userId || resident.id) === String(member.userId))) || member.userId}</td><td>{member.role || "Member"}</td><td>{member.status || "Active"}</td><td><div className="society-row-actions"><button type="button" className="society-workflow-action" onClick={() => { setEditing(member); setForm({ userId: member.userId || "", role: member.role || "MEMBER" }); }}>Edit</button><button type="button" className="society-workflow-action" onClick={() => remove(member)} disabled={busy}>Remove</button></div></td></tr>)}</tbody></table></div> : <div className="society-empty"><h3>No members yet</h3><p>Choose a resident below to add the first member.</p></div>}
            <form onSubmit={save}><CommunityRecordForm resource="members" fields={["userId", "role"]} value={form} options={{ residents }} onChange={setForm}/><footer className="security-modal-footer"><button type="button" onClick={() => { setEditing(null); setForm({ role: "MEMBER" }); }}>Clear</button><button type="submit" className="society-add-button" disabled={busy || !residents.length}>{busy ? "Saving..." : editing ? "Save member" : "Add member"}</button></footer></form>
        </section>
    </div>;
}
