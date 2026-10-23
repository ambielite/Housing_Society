import { useEffect, useMemo, useState } from "react";
import { Building2, Edit, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import societyApi from "../../societies/api/society.api";
import towerApi from "../api/tower.api";
import TowerForm from "../components/TowerForm";
import { RecordDetailsModal } from "../../../components/ui/Modal";

const rowsFrom = (response) => {
    const rows = Array.isArray(response) ? response : response?.data || response?.towers || [];
    return Array.isArray(rows) ? rows : [];
};

const TowerListPage = () => {
    const [towers, setTowers] = useState([]);
    const [societies, setSocieties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingTower, setEditingTower] = useState(null);
    const [viewingTower, setViewingTower] = useState(null);
    const [viewingSociety, setViewingSociety] = useState(null);
    const closeForm = () => { setShowForm(false); setEditingTower(null); };

    useEffect(() => {
        let mounted = true;
        Promise.all([towerApi.getAll(), societyApi.getAll()])
            .then(([towerResponse, societyResponse]) => {
                if (!mounted) return;
                setTowers(rowsFrom(towerResponse));
                setSocieties(rowsFrom(societyResponse));
            })
            .catch((err) => { if (mounted) setError(err.response?.data?.message || "Could not load towers."); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    const reload = async () => {
        setLoading(true);
        setError("");
        try {
            const [towerResponse, societyResponse] = await Promise.all([towerApi.getAll(), societyApi.getAll()]);
            setTowers(rowsFrom(towerResponse));
            setSocieties(rowsFrom(societyResponse));
        } catch (err) {
            setError(err.response?.data?.message || "Could not load towers.");
        } finally { setLoading(false); }
    };

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return towers.filter((tower) => {
            const societyName = societies.find((society) => society.id === tower.societyId)?.name || "";
            return !query || `${tower.name} ${societyName} ${tower.status}`.toLowerCase().includes(query);
        });
    }, [search, societies, towers]);

    const saveComplete = async () => { closeForm(); await reload(); };
    const deactivate = async (tower) => {
        if (!window.confirm(`Deactivate ${tower.name}?`)) return;
        try { await towerApi.deactivate(tower.id); await reload(); }
        catch (err) { setError(err.response?.data?.message || "Could not deactivate tower."); }
    };

    return (
        <section className="society-dashboard">
            <header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> PROPERTY MANAGEMENT</div><h1>Towers</h1><p>Manage towers and their society assignments.</p></div><button className="society-add-button" onClick={() => { setEditingTower(null); setShowForm(true); }} disabled={!societies.length}><Plus size={18} /> Add tower</button></header>
            {error && <div className="society-error" role="alert">{error}<button onClick={reload}>Try again</button></div>}
            <div className="society-stats">
                <article className="society-stat-card"><span className="society-stat-icon society-stat-icon-blue"><Building2 size={19} /></span><div><span className="society-stat-label">Total towers</span><strong>{loading ? "—" : towers.length}</strong></div><span className="society-stat-note">Across all societies</span></article>
                <article className="society-stat-card"><span className="society-stat-icon society-stat-icon-green"><Building2 size={19} /></span><div><span className="society-stat-label">Active</span><strong>{loading ? "—" : towers.filter((tower) => tower.status === "ACTIVE").length}</strong></div><span className="society-stat-note">Currently in use</span></article>
                <article className="society-stat-card"><span className="society-stat-icon society-stat-icon-violet"><Building2 size={19} /></span><div><span className="society-stat-label">Societies</span><strong>{loading ? "—" : societies.length}</strong></div><span className="society-stat-note">Available for assignment</span></article>
            </div>
            {!loading && societies.length === 0 && <div className="society-error">Create a society before adding towers.</div>}
            <section className="society-list-panel">
                <div className="society-list-heading"><div><h2>Your towers</h2><p>Review tower names, floor counts, and status.</p></div><span className="society-count">{filtered.length} {filtered.length === 1 ? "tower" : "towers"}</span></div>
                <div className="society-toolbar"><label className="society-search"><Search size={17} /><input aria-label="Search towers" placeholder="Search tower or society..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><button className="society-refresh-button" onClick={reload} disabled={loading}><RefreshCw size={16} className={loading ? "society-spinning" : ""} /> Refresh</button></div>
                {loading ? <div className="society-loading"><span className="society-loader" />Loading towers...</div> : filtered.length === 0 ? <div className="society-empty"><span className="society-empty-icon"><Building2 size={24} /></span><h3>{search ? "No matching towers" : "No towers yet"}</h3><p>{search ? "Try another search." : "Add a tower to start organizing floors and units."}</p></div> : (
                    <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Tower</th><th>Society</th><th>Floors</th><th>Status</th><th className="society-actions-heading">Actions</th></tr></thead><tbody>
                        {filtered.map((tower) => <tr key={tower.id}><td><div className="society-name-cell"><span className="society-avatar"><Building2 size={19} /></span><span><button type="button" className="record-details-trigger" onClick={() => setViewingTower(tower)}>{tower.name}</button><small>Created {tower.createdAt ? new Date(tower.createdAt).toLocaleDateString() : "—"}</small></span></div></td><td><button type="button" className="record-details-trigger" onClick={() => { const society = societies.find((item) => item.id === tower.societyId); if (society) setViewingSociety(society); }}>{societies.find((society) => society.id === tower.societyId)?.name || "Society"}</button></td><td>{tower.floorCount}</td><td><span className={tower.status === "ACTIVE" ? "society-registration" : "society-muted"}>{tower.status || "ACTIVE"}</span></td><td><div className="society-row-actions"><button className="society-icon-action" title="Edit tower" aria-label={`Edit ${tower.name}`} onClick={() => { setEditingTower(tower); setShowForm(true); }}><Edit size={16} /></button>{tower.status !== "INACTIVE" && <button className="society-icon-action society-delete-action" title="Deactivate tower" aria-label={`Deactivate ${tower.name}`} onClick={() => deactivate(tower)}><Trash2 size={16} /></button>}</div></td></tr>)}
                    </tbody></table></div>
                )}
            </section>
            {showForm && <div className="society-modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}><TowerForm key={editingTower?.id || "new-tower"} tower={editingTower} societies={societies} onClose={closeForm} onSuccess={saveComplete} /></div>}
            {viewingTower && <RecordDetailsModal title={viewingTower.name || "Tower details"} subtitle="Tower profile and society assignment" icon={Building2} onClose={() => setViewingTower(null)} sections={[
                { title: "Tower information", fields: [["Status", viewingTower.status || "ACTIVE"], ["Floors", viewingTower.floorCount], ["Tower ID", viewingTower.id], ["Created", viewingTower.createdAt ? new Date(viewingTower.createdAt).toLocaleString() : null]] },
                { title: "Society", fields: [["Society name", societies.find((society) => society.id === viewingTower.societyId)?.name], ["Email", societies.find((society) => society.id === viewingTower.societyId)?.email], ["Phone", societies.find((society) => society.id === viewingTower.societyId)?.phone], ["Address", societies.find((society) => society.id === viewingTower.societyId)?.address]] }
            ]} />}
            {viewingSociety && <RecordDetailsModal title={viewingSociety.name || "Society details"} subtitle="Society profile and registered information" icon={Building2} onClose={() => setViewingSociety(null)} sections={[
                { title: "Contact information", fields: [["Email", viewingSociety.email], ["Phone", viewingSociety.phone], ["Address", viewingSociety.address]] },
                { title: "Registration and tax", fields: [["RERA number", viewingSociety.reraNumber], ["PAN", viewingSociety.pan], ["GSTIN", viewingSociety.gstin]] },
                { title: "Property and region", fields: [["Structural area", viewingSociety.structuralArea == null ? null : `${viewingSociety.structuralArea} sq. ft.`], ["Currency", viewingSociety.currency], ["Timezone", viewingSociety.timezone], ["Society ID", viewingSociety.id]] }
            ]} />}
        </section>
    );
};

export default TowerListPage;
