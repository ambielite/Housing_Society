import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users,
    Building2,
    Wallet,
    ShieldCheck,
    RefreshCw,
    ArrowRight,
    ClipboardCheck
} from "lucide-react";

import residentApi from "../../residents/api/resident.api";
import societyApi from "../../societies/api/society.api";
import residentVerificationApi from "../../residents/api/residentVerification.api";
import nonMemberApi from "../../residents/api/nonMember.api";

const REFRESH_INTERVAL_MS = 30000; // poll every 30s

const Dashboard = () => {
    const navigate = useNavigate();
    const [totalResidents, setTotalResidents] = useState(0);
    const [totalSocieties, setTotalSocieties] = useState(0);
    const [outstandingDues, setOutstandingDues] = useState(0);
    const [pendingApprovals, setPendingApprovals] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pendingTasks, setPendingTasks] = useState([]);

    const loadCounts = async () => {
        try {
            setLoading(true);

            const [resResidents, resSocieties, resVerifications] = await Promise.all([
                residentApi.getAll(),
                societyApi.getAll(),
                residentVerificationApi.getPendingQueue()
            ].map(p => p.catch ? p : p));

            // residentApi.getAll() and societyApi.getAll() return arrays or data structures
            const residents = Array.isArray(resResidents) ? resResidents : (resResidents?.data || resResidents?.records || []);
            const societies = Array.isArray(resSocieties) ? resSocieties : (resSocieties?.data || resSocieties?.records || []);
            const verifications = Array.isArray(resVerifications) ? resVerifications : (resVerifications?.data || resVerifications?.records || []);

            setTotalResidents(residents.length || 0);
            setTotalSocieties(societies.length || 0);
            setPendingApprovals(verifications.length || 0);
            setPendingTasks(verifications.slice(0, 5));

            // Outstanding dues: backend endpoint may not exist; leave as 0 if not available
            // If there's an invoices/billing API later, replace this with a real call.
            setOutstandingDues((prev) => prev || 0);
        } catch (err) {
            // swallow errors for now; the page should remain usable
            console.error("Dashboard counts load failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;

        loadCounts();
        // also load recent activity once
        loadRecentActivities();

        const id = setInterval(() => {
            if (mounted) {
                loadCounts();
                loadRecentActivities();
            }
        }, REFRESH_INTERVAL_MS);

        return () => {
            mounted = false;
            clearInterval(id);
        };
    }, []);

    const [recentActivities, setRecentActivities] = useState([]);

    const loadRecentActivities = async () => {
        try {
            const [resResidents, resVerifications, resNonMembers] = await Promise.all([
                residentApi.getAll({ limit: 6 }),
                residentVerificationApi.getAll({ limit: 6 }),
                nonMemberApi.getAll({ limit: 6 })
            ]);

            const residents = Array.isArray(resResidents) ? resResidents : (resResidents?.data || resResidents?.records || []);
            const verifications = Array.isArray(resVerifications) ? resVerifications : (resVerifications?.data || resVerifications?.records || []);
            const nonMembers = Array.isArray(resNonMembers) ? resNonMembers : (resNonMembers?.data || resNonMembers?.records || []);

            const items = [];

            residents.slice(0, 6).forEach((r) => {
                items.push({
                    type: "resident",
                    title: r.displayName || [r.firstName, r.lastName].filter(Boolean).join(" ") || "Unnamed resident",
                    subtitle: "New resident",
                    at: r.createdAt || r.createdOn || r.created || null
                });
            });

            verifications.slice(0, 6).forEach((v) => {
                items.push({
                    type: "verification",
                    title: v.residentDisplayName || v.residentId || "Resident",
                    subtitle: `Verification: ${v.status || v.verificationType || "Pending"}`,
                    at: v.createdAt || v.submittedAt || null
                });
            });

            nonMembers.slice(0, 6).forEach((n) => {
                items.push({
                    type: "non-member",
                    title: n.name,
                    subtitle: `Non-member: ${n.memberType || "Other"}`,
                    at: n.createdAt || n.startDate || null
                });
            });

            // sort by timestamp desc if available, otherwise keep insertion order
            const sorted = items
                .map((it) => ({ ...it, ts: it.at ? new Date(it.at).getTime() : 0 }))
                .sort((a, b) => b.ts - a.ts)
                .slice(0, 8);

            setRecentActivities(sorted);
        } catch (err) {
            console.error("Failed to load recent activity", err);
        }
    };

    const refreshDashboard = async () => {
        setRefreshing(true);
        await Promise.allSettled([loadCounts(), loadRecentActivities()]);
        setRefreshing(false);
    };

    const cards = [
        { title: "Total Residents", value: loading ? "—" : String(totalResidents), icon: Users },
        { title: "Total Societies", value: loading ? "—" : String(totalSocieties), icon: Building2 },
        { title: "Outstanding Dues", value: loading ? "—" : `₹${outstandingDues}` , icon: Wallet },
        { title: "Pending Approvals", value: loading ? "—" : String(pendingApprovals), icon: ShieldCheck }
    ];

    return (
        <main className="dashboard-page dashboard-home">

            <div className="page-header dashboard-home-header">

                <div>
                    <h1>Dashboard</h1>

                    <p>
                        Overview of your housing society
                        operations.
                    </p>
                </div>

                <button className="dashboard-refresh-button" onClick={refreshDashboard} disabled={refreshing}>
                    <RefreshCw size={16} className={refreshing ? "dashboard-spin" : ""} />
                    {refreshing ? "Refreshing…" : "Refresh"}
                </button>
            </div>

            <div className="dashboard-cards">

                {cards.map((card) => {

                    const Icon = card.icon;

                    return (
                        <article className="stat-card" key={card.title}>

                            <div className="stat-icon">
                                <Icon size={22} />
                            </div>

                            <div>
                                <span>
                                    {card.title}
                                </span>

                                <h2>
                                    {card.value}
                                </h2>
                            </div>

                        </article>
                    );
                })}

            </div>

            <div className="dashboard-grid dashboard-home-grid">

                <div className="dashboard-panel">

                    <div className="dashboard-panel-heading">
                        <div><h3>Recent Activity</h3><p>Latest resident, verification and membership updates.</p></div>
                        <span>{recentActivities.length} records</span>
                    </div>

                    {recentActivities.length === 0 ? (
                        <div className="empty-state">No recent activity available.</div>
                    ) : (
                        <ul className="recent-activity-list">
                            {recentActivities.map((act, idx) => (
                                <li key={`${act.type}-${idx}`} className="recent-activity-item">
                                    <div className="recent-activity-icon">
                                        {act.type === "resident" && <Users size={16} />}
                                        {act.type === "verification" && <ShieldCheck size={16} />}
                                        {act.type === "non-member" && <Building2 size={16} />}
                                    </div>
                                    <div className="recent-activity-content">
                                        <strong>{act.title}</strong>
                                        <div className="recent-activity-sub">{act.subtitle}</div>
                                    </div>
                                    <div className="recent-activity-time">{act.at ? new Date(act.at).toLocaleString() : "—"}</div>
                                </li>
                            ))}
                        </ul>
                    )}

                </div>

                <div className="dashboard-panel">

                    <div className="dashboard-panel-heading">
                        <div><h3>Pending Tasks</h3><p>Items that need an administrator’s attention.</p></div>
                        <span className="dashboard-task-count">{pendingApprovals}</span>
                    </div>
                    {pendingTasks.length ? (
                        <ul className="dashboard-task-list">
                            {pendingTasks.map((task, index) => {
                                const resident = task.residentDisplayName || task.residentName || task.resident?.displayName || task.residentId || "Resident verification";
                                return <li key={task.id || task._id || `${resident}-${index}`}>
                                    <span className="dashboard-task-icon"><ClipboardCheck size={17}/></span>
                                    <span className="dashboard-task-copy"><strong>{resident}</strong><small>{task.verificationType || task.type || "Resident verification"} · {task.status || "Pending"}</small></span>
                                    <button aria-label={`Review ${resident}`} onClick={() => navigate("/residents/verification")}><ArrowRight size={17}/></button>
                                </li>;
                            })}
                        </ul>
                    ) : <div className="dashboard-empty-task"><span className="dashboard-empty-task-icon"><ShieldCheck size={20}/></span><strong>All caught up</strong><p>There are no pending approvals right now.</p></div>}

                </div>

            </div>

        </main>
    );
};

export default Dashboard;
