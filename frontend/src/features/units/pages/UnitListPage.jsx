import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SquarePen, Home, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import floorApi from "../../floors/api/floor.api";
import societyApi from "../../societies/api/society.api";
import towerApi from "../../towers/api/tower.api";
import unitApi from "../api/unit.api";
import UnitForm from "../components/UnitForm";
import { RecordDetailsModal } from "../../../components/ui/Modal";

const rowsFrom = (response) => {
    const rows = Array.isArray(response) ? response : response?.data || response?.units || [];
    return Array.isArray(rows) ? rows : [];
};

const UnitListPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [units, setUnits] = useState([]);
    const [floors, setFloors] = useState([]);
    const [towers, setTowers] = useState([]);
    const [societies, setSocieties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [viewingUnit, setViewingUnit] = useState(null);
    const closeForm = () => { setShowForm(false); setEditingUnit(null); };

    useEffect(() => {
        let mounted = true;
        Promise.all([unitApi.getAll(), floorApi.getAll(), towerApi.getAll().catch(() => []), societyApi.getAll().catch(() => [])])
            .then(([unitResponse, floorResponse, towerResponse, societyResponse]) => {
                if (!mounted) return;
                setUnits(rowsFrom(unitResponse));
                setFloors(rowsFrom(floorResponse));
                setTowers(rowsFrom(towerResponse));
                setSocieties(rowsFrom(societyResponse));
            })
            .catch((err) => { if (mounted) setError(err.response?.data?.message || "Could not load units."); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        if (searchParams.get("new") !== "1" || loading) return;
        if (floors.length > 0) {
            setEditingUnit(null);
            setShowForm(true);
        }
        setSearchParams({}, { replace: true });
    }, [floors.length, loading, searchParams, setSearchParams]);

    const reload = async () => {
        setLoading(true);
        setError("");
        try {
            const [unitResponse, floorResponse, towerResponse, societyResponse] = await Promise.all([unitApi.getAll(), floorApi.getAll(), towerApi.getAll().catch(() => []), societyApi.getAll().catch(() => [])]);
            setUnits(rowsFrom(unitResponse));
            setFloors(rowsFrom(floorResponse));
            setTowers(rowsFrom(towerResponse));
            setSocieties(rowsFrom(societyResponse));
        } catch (err) {
            setError(err.response?.data?.message || "Could not load units.");
        } finally { setLoading(false); }
    };

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return units.filter((unit) => {
            const floor = floors.find((item) => item.id === unit.floorId);
            const floorName = floor?.name || (floor ? `Floor ${floor.floorNumber}` : "");
            return !query || `${unit.unitNumber} ${unit.bhk || ""} ${unit.propertyType} ${unit.status} ${floorName}`.toLowerCase().includes(query);
        });
    }, [floors, search, units]);

    const saveComplete = async () => { closeForm(); await reload(); };
    const deactivate = async (unit) => {
        if (!window.confirm(`Deactivate unit ${unit.unitNumber}?`)) return;
        try { await unitApi.deactivate(unit.id); await reload(); }
        catch (err) { setError(err.response?.data?.message || "Could not deactivate unit."); }
    };

    return (
        <section className="society-dashboard">
            <header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> PROPERTY MANAGEMENT</div><h1>Units</h1><p>Manage homes and commercial units across your floors.</p></div><button className="society-add-button" onClick={() => { setEditingUnit(null); setShowForm(true); }} disabled={!floors.length}><Plus size={18} /> Add unit</button></header>
            {error && <div className="society-error" role="alert">{error}<button onClick={reload}>Try again</button></div>}
            <div className="society-stats">
                <article className="society-stat-card"><span className="society-stat-icon society-stat-icon-blue"><Home size={19} /></span><div><span className="society-stat-label">Total units</span><strong>{loading ? "—" : units.length}</strong></div><span className="society-stat-note">Across all floors</span></article>
                <article className="society-stat-card"><span className="society-stat-icon society-stat-icon-green"><Home size={19} /></span><div><span className="society-stat-label">Occupied</span><strong>{loading ? "—" : units.filter((unit) => unit.status === "OCCUPIED").length}</strong></div><span className="society-stat-note">Currently occupied</span></article>
                <article className="society-stat-card"><span className="society-stat-icon society-stat-icon-violet"><Home size={19} /></span><div><span className="society-stat-label">Vacant</span><strong>{loading ? "—" : units.filter((unit) => unit.status === "VACANT").length}</strong></div><span className="society-stat-note">Available units</span></article>
            </div>
            {!loading && floors.length === 0 && <div className="society-error">Create a floor before adding units.</div>}
            <section className="society-list-panel">
                <div className="society-list-heading"><div><h2>Your units</h2><p>Review unit configuration, floor, and occupancy status.</p></div><span className="society-count">{filtered.length} {filtered.length === 1 ? "unit" : "units"}</span></div>
                <div className="society-toolbar"><label className="society-search"><Search size={17} /><input aria-label="Search units" placeholder="Search unit, floor, or status..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><button className="society-refresh-button" onClick={reload} disabled={loading}><RefreshCw size={16} className={loading ? "society-spinning" : ""} /> Refresh</button></div>
                {loading ? <div className="society-loading"><span className="society-loader" />Loading units...</div> : filtered.length === 0 ? <div className="society-empty"><span className="society-empty-icon"><Home size={24} /></span><h3>{search ? "No matching units" : "No units yet"}</h3><p>{search ? "Try another search." : "Add units to your floors to complete the property directory."}</p></div> : (
                    <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Unit</th><th>Floor</th><th>Type / layout</th><th>Area</th><th>Status</th><th className="society-actions-heading">Actions</th></tr></thead><tbody>
                        {filtered.map((unit) => {
                            const floor = floors.find((item) => item.id === unit.floorId);
                            return <tr key={unit.id}><td><div className="society-name-cell"><span className="society-avatar"><Home size={19} /></span><span><button type="button" className="record-details-trigger" onClick={() => setViewingUnit(unit)}>{unit.unitNumber}</button><small>{unit.bhk || "Configuration not set"}</small></span></div></td><td>{floor?.name || (floor ? `Floor ${floor.floorNumber}` : "Floor")}</td><td>{unit.propertyType || "RESIDENTIAL"}</td><td><span className="society-tax-label">Carpet:-</span> {unit.carpetArea ?? "—"}<br /><span className="society-tax-label">Built-up:-</span> {unit.builtUpArea ?? "—"}</td><td><span className={unit.status === "VACANT" ? "society-registration" : "society-muted"}>{(unit.status || "VACANT").replaceAll("_", " ")}</span></td><td><div className="society-row-actions"><button className="society-icon-action" title="Edit unit" aria-label={`Edit unit ${unit.unitNumber}`} onClick={() => { setEditingUnit(unit); setShowForm(true); }}><SquarePen size={16} /></button>{unit.status !== "INACTIVE" && <button className="society-icon-action society-delete-action" title="Deactivate unit" aria-label={`Deactivate unit ${unit.unitNumber}`} onClick={() => deactivate(unit)}><Trash2 size={16} /></button>}</div></td></tr>;
                        })}
                    </tbody></table></div>
                )}
            </section>
            {showForm && <div className="society-modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}><UnitForm key={editingUnit?.id || "new-unit"} unit={editingUnit} floors={floors} towers={towers} onClose={closeForm} onSuccess={saveComplete} /></div>}
            {viewingUnit && (() => { const floor = floors.find((item) => item.id === viewingUnit.floorId); const tower = floor && towers.find((item) => item.id === floor.towerId); const society = tower && societies.find((item) => item.id === tower.societyId); return <RecordDetailsModal title={`Unit ${viewingUnit.unitNumber || "details"}`} subtitle="Home profile and property assignment" icon={Home} onClose={() => setViewingUnit(null)} sections={[
                { title: "Unit information", fields: [["Unit number", viewingUnit.unitNumber], ["Configuration", viewingUnit.bhk], ["Property type", viewingUnit.propertyType], ["Status", viewingUnit.status || "VACANT"], ["Unit ID", viewingUnit.id]] },
                { title: "Area details", fields: [["Carpet area", viewingUnit.carpetArea == null ? null : `${viewingUnit.carpetArea} sq. ft.`], ["Built-up area", viewingUnit.builtUpArea == null ? null : `${viewingUnit.builtUpArea} sq. ft.`]] },
                { title: "Location", fields: [["Floor", floor?.name || (floor ? `Floor ${floor.floorNumber}` : null)], ["Tower", tower?.name], ["Society", society?.name], ["Society ID", society?.id]] },
                { title: "Society contact", fields: [["Email", society?.email], ["Phone", society?.phone], ["Address", society?.address]] }
            ]} />; })()}
        </section>
    );
};

export default UnitListPage;
