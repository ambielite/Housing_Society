import { useEffect, useMemo, useState } from "react";
import { SquarePen, Layers3, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import floorApi from "../api/floor.api";
import towerApi from "../../towers/api/tower.api";
import FloorForm from "../components/FloorForm";
import { RecordDetailsModal } from "../../../components/ui/Modal";

const rowsFrom = (response) => {
    const rows = Array.isArray(response) ? response : response?.data || response?.floors || [];
    return Array.isArray(rows) ? rows : [];
};

const FloorListPage = () => {
    const [floors, setFloors] = useState([]);
    const [towers, setTowers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingFloor, setEditingFloor] = useState(null);
    const [viewingFloor, setViewingFloor] = useState(null);
    const closeForm = () => { setShowForm(false); setEditingFloor(null); };

    useEffect(() => {
        let mounted = true;
        Promise.all([floorApi.getAll(), towerApi.getAll()])
            .then(([floorResponse, towerResponse]) => {
                if (!mounted) return;
                setFloors(rowsFrom(floorResponse));
                setTowers(rowsFrom(towerResponse));
            })
            .catch((err) => { if (mounted) setError(err.response?.data?.message || "Could not load floors."); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    const reload = async () => {
        setLoading(true);
        setError("");
        try {
            const [floorResponse, towerResponse] = await Promise.all([floorApi.getAll(), towerApi.getAll()]);
            setFloors(rowsFrom(floorResponse));
            setTowers(rowsFrom(towerResponse));
        } catch (err) {
            setError(err.response?.data?.message || "Could not load floors.");
        } finally { setLoading(false); }
    };

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return floors.filter((floor) => {
            const towerName = towers.find((tower) => tower.id === floor.towerId)?.name || "";
            return !query || `${floor.name || ""} ${floor.floorNumber} ${towerName} ${floor.status}`.toLowerCase().includes(query);
        });
    }, [floors, search, towers]);

    const saveComplete = async () => { closeForm(); await reload(); };
    const deactivate = async (floor) => {
        if (!window.confirm(`Deactivate floor ${floor.floorNumber}?`)) return;
        try { await floorApi.deactivate(floor.id); await reload(); }
        catch (err) { setError(err.response?.data?.message || "Could not deactivate floor."); }
    };

    return (
        <section className="society-dashboard">
            <header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> PROPERTY MANAGEMENT</div><h1>Floors</h1><p>Organize floors within each tower.</p></div><button className="society-add-button" onClick={() => { setEditingFloor(null); setShowForm(true); }} disabled={!towers.length}><Plus size={18} /> Add floor</button></header>
            {error && <div className="society-error" role="alert">{error}<button onClick={reload}>Try again</button></div>}
            <div className="society-stats">
                <article className="society-stat-card"><span className="society-stat-icon society-stat-icon-blue"><Layers3 size={19} /></span><div><span className="society-stat-label">Total floors</span><strong>{loading ? "—" : floors.length}</strong></div><span className="society-stat-note">Across all towers</span></article>
                <article className="society-stat-card"><span className="society-stat-icon society-stat-icon-green"><Layers3 size={19} /></span><div><span className="society-stat-label">Active</span><strong>{loading ? "—" : floors.filter((floor) => floor.status === "ACTIVE").length}</strong></div><span className="society-stat-note">Currently in use</span></article>
                <article className="society-stat-card"><span className="society-stat-icon society-stat-icon-violet"><Layers3 size={19} /></span><div><span className="society-stat-label">Towers</span><strong>{loading ? "—" : towers.length}</strong></div><span className="society-stat-note">Available for assignment</span></article>
            </div>
            {!loading && towers.length === 0 && <div className="society-error">Create a tower before adding floors.</div>}
            <section className="society-list-panel">
                <div className="society-list-heading"><div><h2>Your floors</h2><p>Review floor numbers and their parent towers.</p></div><span className="society-count">{filtered.length} {filtered.length === 1 ? "floor" : "floors"}</span></div>
                <div className="society-toolbar"><label className="society-search"><Search size={17} /><input aria-label="Search floors" placeholder="Search floor or tower..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><button className="society-refresh-button" onClick={reload} disabled={loading}><RefreshCw size={16} className={loading ? "society-spinning" : ""} /> Refresh</button></div>
                {loading ? <div className="society-loading"><span className="society-loader" />Loading floors...</div> : filtered.length === 0 ? <div className="society-empty"><span className="society-empty-icon"><Layers3 size={24} /></span><h3>{search ? "No matching floors" : "No floors yet"}</h3><p>{search ? "Try another search." : "Add floors to your towers to organize units."}</p></div> : (
                    <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Floor</th><th>Tower</th><th>Floor number</th><th>Status</th><th className="society-actions-heading">Actions</th></tr></thead><tbody>
                        {filtered.map((floor) => <tr key={floor.id}><td><div className="society-name-cell"><span className="society-avatar"><Layers3 size={19} /></span><span><button type="button" className="record-details-trigger" onClick={() => setViewingFloor(floor)}>{floor.name || `Floor ${floor.floorNumber}`}</button><small>{floor.name ? `Floor ${floor.floorNumber}` : "No custom label"}</small></span></div></td><td>{towers.find((tower) => tower.id === floor.towerId)?.name || "Tower"}</td><td>{floor.floorNumber}</td><td><span className={floor.status === "ACTIVE" ? "society-registration" : "society-muted"}>{floor.status || "ACTIVE"}</span></td><td><div className="society-row-actions"><button className="society-icon-action" title="Edit floor" aria-label={`Edit floor ${floor.floorNumber}`} onClick={() => { setEditingFloor(floor); setShowForm(true); }}><SquarePen size={16} /></button>{floor.status !== "INACTIVE" && <button className="society-icon-action society-delete-action" title="Deactivate floor" aria-label={`Deactivate floor ${floor.floorNumber}`} onClick={() => deactivate(floor)}><Trash2 size={16} /></button>}</div></td></tr>)}
                    </tbody></table></div>
                )}
            </section>
            {showForm && <div className="society-modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}><FloorForm key={editingFloor?.id || "new-floor"} floor={editingFloor} towers={towers} onClose={closeForm} onSuccess={saveComplete} /></div>}
            {viewingFloor && <RecordDetailsModal title={viewingFloor.name || `Floor ${viewingFloor.floorNumber}`} subtitle="Floor profile and tower assignment" icon={Layers3} onClose={() => setViewingFloor(null)} sections={[
                { title: "Floor information", fields: [["Floor name", viewingFloor.name], ["Floor number", viewingFloor.floorNumber], ["Status", viewingFloor.status || "ACTIVE"], ["Floor ID", viewingFloor.id]] },
                { title: "Tower", fields: [["Tower name", towers.find((tower) => tower.id === viewingFloor.towerId)?.name], ["Tower ID", viewingFloor.towerId]] }
            ]} />}
        </section>
    );
};

export default FloorListPage;
