import { useEffect, useMemo, useState } from "react";
import {
    ArrowDownLeft,
    ArrowUpRight,
    BadgeCheck,
    Building2,
    FileCheck2,
    RefreshCw,
    Search,
    ShieldCheck,
    Users
} from "lucide-react";
import moveInApi from "../api/moveIn.api";
import moveOutApi from "../api/moveOut.api";
import agreementApi from "../api/agreement.api";

const rowsFrom = (response) => {
    const rows = Array.isArray(response) ? response : response?.data || response?.records || [];
    return Array.isArray(rows) ? rows : [];
};

const statusTone = (status) => ["COMPLETED", "ACTIVE", "APPROVED", "ACCESS_REVOKED", "RENEWED"].includes(status) ? "success" : ["REJECTED", "CANCELLED", "TERMINATED", "EXPIRED"].includes(status) ? "danger" : ["PENDING_DOCUMENTS", "INFORMATION_REQUIRED", "REQUESTED", "UNDER_VERIFICATION", "CHECKLIST_PENDING", "DUES_PENDING", "FINANCIAL_CLEARANCE_PENDING"].includes(status) ? "pending" : "neutral";

const MoveInOutDashboardPage = () => {
    const [moveIns, setMoveIns] = useState([]);
    const [moveOuts, setMoveOuts] = useState([]);
    const [agreements, setAgreements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [moveInResponse, moveOutResponse, agreementResponse] = await Promise.all([
                moveInApi.getAll(),
                moveOutApi.getAll(),
                agreementApi.getAll()
            ]);

            setMoveIns(rowsFrom(moveInResponse));
            setMoveOuts(rowsFrom(moveOutResponse));
            setAgreements(rowsFrom(agreementResponse));
        } catch (err) {
            setError(err.response?.data?.message || "Could not load Move-In/Out data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const run = async () => {
            try {
                const [moveInResponse, moveOutResponse, agreementResponse] = await Promise.all([
                    moveInApi.getAll(),
                    moveOutApi.getAll(),
                    agreementApi.getAll()
                ]);

                if (!isMounted) return;
                setMoveIns(rowsFrom(moveInResponse));
                setMoveOuts(rowsFrom(moveOutResponse));
                setAgreements(rowsFrom(agreementResponse));
            } catch (err) {
                if (isMounted) {
                    setError(err.response?.data?.message || "Could not load Move-In/Out data.");
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        run();
        return () => { isMounted = false; };
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return [...moveIns, ...moveOuts, ...agreements];

        return [...moveIns, ...moveOuts, ...agreements].filter((item) => {
            const text = [
                item.status,
                item.occupancyType,
                item.requestedMoveInDate,
                item.requestedMoveOutDate,
                item.agreementType,
                item.agreementReference,
                item.remarks,
                item.unitId,
                item.residentId
            ].filter(Boolean).join(" ").toLowerCase();

            return text.includes(q);
        });
    }, [agreements, moveIns, moveOuts, search]);

    const summary = [
        {
            label: "Move-ins",
            value: loading ? "—" : moveIns.length,
            note: "Open transitions",
            icon: ArrowDownLeft,
            tone: "blue"
        },
        {
            label: "Move-outs",
            value: loading ? "—" : moveOuts.length,
            note: "Pending exits",
            icon: ArrowUpRight,
            tone: "amber"
        },
        {
            label: "Agreements",
            value: loading ? "—" : agreements.length,
            note: "Live records",
            icon: FileCheck2,
            tone: "green"
        },
        {
            label: "Verified",
            value: loading ? "—" : moveIns.filter((item) => item.status === "UNDER_VERIFICATION").length + moveOuts.filter((item) => item.status === "UNDER_VERIFICATION").length,
            note: "In review",
            icon: ShieldCheck,
            tone: "violet"
        },
        {
            label: "Pending documents",
            value: loading ? "—" : moveIns.filter((item) => ["PENDING_DOCUMENTS", "INFORMATION_REQUIRED"].includes(item.status)).length,
            note: "Move-in applications",
            icon: FileCheck2,
            tone: "amber"
        },
        {
            label: "Outstanding clearance",
            value: loading ? "—" : moveOuts.filter((item) => item.financialClearanceStatus !== "CLEARED" && !["CANCELLED", "REJECTED"].includes(item.status)).length,
            note: "Move-outs awaiting clearance",
            icon: BadgeCheck,
            tone: "blue"
        },
        {
            label: "Avg. transition days",
            value: loading ? "—" : (() => {
                const completed = [...moveIns, ...moveOuts].filter((item) => item.actualMoveInDate || item.actualMoveOutDate);
                if (!completed.length) return "—";
                const total = completed.reduce((sum, item) => {
                    const start = new Date(item.createdAt || item.created_at).getTime();
                    const end = new Date(item.actualMoveInDate || item.actualMoveOutDate).getTime();
                    return sum + (Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, end - start) / 86400000 : 0);
                }, 0);
                return Math.round(total / completed.length);
            })(),
            note: "From request to effective date",
            icon: ShieldCheck,
            tone: "green"
        }
    ];

    return (
        <section className="society-dashboard">
            <header className="society-heading">
                <div>
                    <div className="society-eyebrow"><span className="society-eyebrow-dot" /> MOVE-IN / MOVE-OUT MANAGEMENT</div>
                    <h1>Move-In / Move-Out</h1>
                    <p>Track applications, agreements, gate passes, and transition approvals.</p>
                </div>
                <button className="society-refresh-button" onClick={loadData} disabled={loading}><RefreshCw size={16} className={loading ? "society-spinning" : ""} /> Refresh</button>
            </header>

            {error && <div className="society-error" role="alert">{error}<button onClick={loadData}>Try again</button></div>}

            <div className="society-stats">
                {summary.map(({ label, value, note, icon: Icon, tone }) => (
                    <article key={label} className="society-stat-card">
                        <span className={`society-stat-icon society-stat-icon-${tone}`}><Icon size={19} /></span>
                        <div>
                            <span className="society-stat-label">{label}</span>
                            <strong>{value}</strong>
                        </div>
                        <span className="society-stat-note">{note}</span>
                    </article>
                ))}
            </div>

            <section className="society-list-panel">
                <div className="society-list-heading">
                    <div>
                        <h2>Transition overview</h2>
                        <p>Review move-in, move-out, and agreement activity across the portfolio.</p>
                    </div>
                    <span className="society-count">{filtered.length} records</span>
                </div>

                <div className="society-toolbar">
                    <label className="society-search">
                        <Search size={17} />
                        <input aria-label="Search move-in/out records" placeholder="Search by status, date, unit or resident..." value={search} onChange={(event) => setSearch(event.target.value)} />
                    </label>
                </div>

                {loading ? (
                    <div className="society-loading"><span className="society-loader" />Loading transition data...</div>
                ) : filtered.length === 0 ? (
                    <div className="society-empty">
                        <span className="society-empty-icon"><Building2 size={24} /></span>
                        <h3>No matching records</h3>
                        <p>Try another search or create a move-in or move-out request.</p>
                    </div>
                ) : (
                    <div className="society-table-wrap">
                        <table className="society-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Unit / Resident</th>
                                    <th>Reference</th>
                                    <th>Timeline</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item, index) => {
                                    const type = item.occupancyType ? "Move-in" : item.requestedMoveOutDate ? "Move-out" : "Agreement";
                                    const status = item.status || "ACTIVE";
                                    const unit = item.unitId || "—";
                                    const resident = item.residentId || "—";
                                    const reference = item.agreementReference || item.id?.slice(0, 8) || "—";
                                    const timeline = item.requestedMoveInDate || item.requestedMoveOutDate || item.startDate || item.expiryDate || "—";

                                    return (
                                        <tr key={`${type}-${item.id || index}`}>
                                            <td>
                                                <div className="society-name-cell">
                                                    <span className="society-avatar"><Users size={18} /></span>
                                                    <span>
                                                        <strong>{type}</strong>
                                                        <small>{item.occupancyType || item.agreementType || "Transition"}</small>
                                                    </span>
                                                </div>
                                            </td>
                                            <td><span className={`moveinout-status moveinout-status-${statusTone(status)}`}>{status}</span></td>
                                            <td><strong>{unit}</strong><br /><small>{resident}</small></td>
                                            <td>{reference}</td>
                                            <td>{timeline}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </section>
    );
};

export default MoveInOutDashboardPage;
