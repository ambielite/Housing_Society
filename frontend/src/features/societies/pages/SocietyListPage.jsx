import { useEffect, useMemo, useState } from "react";
import {
    Building2, CheckCircle2, Edit, MapPin, Plus,
    RefreshCw, Search, Trash2
} from "lucide-react";
import societyApi from "../api/society.api";
import SocietyForm from "../components/SocietyForm";

const SocietyPage = () => {
    const [societies, setSocieties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingSociety, setEditingSociety] = useState(null);
    const closeForm = () => { setShowForm(false); setEditingSociety(null); };

    const loadSocieties = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await societyApi.getAll();
            const list = Array.isArray(response) ? response : response?.data || response?.societies || [];
            setSocieties(Array.isArray(list) ? list : []);
        } catch (err) {
            setError(err.response?.data?.message || "Could not load societies. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        societyApi.getAll()
            .then((response) => {
                if (!isMounted) return;
                const list = Array.isArray(response)
                    ? response
                    : response?.data || response?.societies || [];
                setSocieties(Array.isArray(list) ? list : []);
            })
            .catch((err) => {
                if (isMounted) {
                    setError(err.response?.data?.message || "Could not load societies. Please try again.");
                }
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        if (!showForm) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const handleKeyDown = (event) => {
            if (event.key === "Escape") closeForm();
        };
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [showForm]);

    const filteredSocieties = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return societies;
        return societies.filter((society) =>
            [society.name, society.reraNumber, society.pan, society.gstin, society.address]
                .some((value) => value?.toLowerCase().includes(query))
        );
    }, [societies, search]);

    const openCreate = () => { setEditingSociety(null); setShowForm(true); };
    const openEdit = (society) => { setEditingSociety(society); setShowForm(true); };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this society?")) return;
        try {
            await societyApi.delete(id);
            await loadSocieties();
        } catch (err) {
            window.alert(err.response?.data?.message || "Failed to delete society.");
        }
    };

    const handleFormSuccess = async () => {
        closeForm();
        await loadSocieties();
    };

    return (
        <section className="society-dashboard">
            <header className="society-heading">
                <div>
                    <div className="society-eyebrow"><span className="society-eyebrow-dot" /> COMMUNITY MANAGEMENT</div>
                    <h1>Societies</h1>
                    <p>Manage your communities, registrations, and location details.</p>
                </div>
                <button className="society-add-button" onClick={openCreate}><Plus size={18} strokeWidth={2.4} /> Add Society</button>
            </header>

            {error && <div className="society-error" role="alert">{error}<button onClick={loadSocieties}>Try again</button></div>}

            <div className="society-stats">
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-blue"><Building2 size={19} /></span>
                    <div><span className="society-stat-label">Total societies</span><strong>{loading ? "—" : societies.length}</strong></div>
                    <span className="society-stat-note">In your portfolio</span>
                </article>
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-green"><CheckCircle2 size={19} /></span>
                    <div><span className="society-stat-label">Registered</span><strong>{loading ? "—" : societies.filter((s) => s.reraNumber).length}</strong></div>
                    <span className="society-stat-note">With RERA details</span>
                </article>
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-violet"><MapPin size={19} /></span>
                    <div><span className="society-stat-label">Locations</span><strong>{loading ? "—" : new Set(societies.map((s) => s.address).filter(Boolean)).size}</strong></div>
                    <span className="society-stat-note">Unique addresses</span>
                </article>
            </div>

            <section className="society-list-panel">
                <div className="society-list-heading">
                    <div><h2>Your societies</h2><p>View and manage your registered communities.</p></div>
                    <span className="society-count">{loading ? "Loading" : `${filteredSocieties.length} ${filteredSocieties.length === 1 ? "society" : "societies"}`}</span>
                </div>
                <div className="society-toolbar">
                    <label className="society-search"><Search size={17} /><input aria-label="Search societies" placeholder="Search by name, registration, or address..." value={search} onChange={(e) => setSearch(e.target.value)} /><kbd>⌕</kbd></label>
                    <button className="society-refresh-button" onClick={loadSocieties} disabled={loading}><RefreshCw size={16} className={loading ? "society-spinning" : ""} /> Refresh</button>
                </div>

                {loading ? <div className="society-loading"><span className="society-loader" />Loading your societies...</div> : filteredSocieties.length === 0 ? (
                    <div className="society-empty"><span className="society-empty-icon"><Building2 size={24} /></span><h3>{search ? "No matching societies" : "No societies yet"}</h3><p>{search ? "Try another name, registration number, or address." : "Add your first society to start managing your community."}</p>{!search && <button className="society-add-button" onClick={openCreate}><Plus size={17} /> Add your first society</button>}</div>
                ) : (
                    <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Society</th><th>Registration</th><th>Tax details</th><th>Region</th><th className="society-actions-heading">Actions</th></tr></thead>
                        <tbody>{filteredSocieties.map((society) => <tr key={society.id}>
                            <td><div className="society-name-cell"><span className="society-avatar"><Building2 size={19} /></span><span><strong>{society.name || "Unnamed society"}</strong><small>{society.address || "Address not added"}</small></span></div></td>
                            <td>{society.reraNumber ? <span className="society-registration"><CheckCircle2 size={14} /> {society.reraNumber}</span> : <span className="society-muted">Not provided</span>}</td>
                            <td><span className="society-tax-label">PAN:-</span> {society.pan || "—"}<br /><span className="society-tax-label">GSTIN:-</span> {society.gstin || "—"}</td>
                            <td><span className="society-region"><span className="society-region-dot" />{society.currency || "INR"}<small>{society.timezone || "Asia/Kolkata"}</small></span></td>
                            <td><div className="society-row-actions"><button className="society-icon-action" title="Edit society" aria-label={`Edit ${society.name}`} onClick={() => openEdit(society)}><Edit size={16} /></button><button className="society-icon-action society-delete-action" title="Delete society" aria-label={`Delete ${society.name}`} onClick={() => handleDelete(society.id)}><Trash2 size={16} /></button></div></td>
                        </tr>)}</tbody>
                    </table></div>
                )}
            </section>

            {showForm && <div className="society-modal-layer" onMouseDown={(e) => { if (e.target === e.currentTarget) closeForm(); }}><SocietyForm key={editingSociety?.id || "new-society"} society={editingSociety} onClose={closeForm} onSuccess={handleFormSuccess} /></div>}
        </section>
    );
};

export default SocietyPage;
