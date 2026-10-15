import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    Building2,
    CheckCircle2,
    Clock3,
    FileText,
    Home,
    ShieldAlert,
    Users,
    UserRound,
    Wallet
} from "lucide-react";

import residentApi from "../api/resident.api";
import residentVerificationApi from "../api/residentVerification.api";
import nonMemberApi from "../api/nonMember.api";

const rowsFrom = (response) => {
    const rows = Array.isArray(response) ? response : response?.data || response?.residents || response?.records || [];
    return Array.isArray(rows) ? rows : [];
};

const ResidentDashboardPage = () => {
    const [residentStats, setResidentStats] = useState({
        total: 0,
        active: 0,
        pending: 0,
        suspended: 0,
        blacklisted: 0,
        archived: 0
    });
    const [verificationQueue, setVerificationQueue] = useState([]);
    const [nonMembers, setNonMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const [residentsResponse, verificationResponse, nonMemberResponse] = await Promise.all([
                residentApi.getAll(),
                residentVerificationApi.getPendingQueue(),
                nonMemberApi.getAll()
            ]);

            const residents = rowsFrom(residentsResponse);
            const pendingVerifications = rowsFrom(verificationResponse);
            const members = rowsFrom(nonMemberResponse);

            setResidentStats({
                total: residents.length,
                active: residents.filter((resident) => resident.status === "ACTIVE").length,
                pending: residents.filter((resident) => resident.status === "PENDING").length,
                suspended: residents.filter((resident) => resident.status === "SUSPENDED").length,
                blacklisted: residents.filter((resident) => resident.status === "BLACKLISTED").length,
                archived: residents.filter((resident) => resident.status === "ARCHIVED").length
            });

            setVerificationQueue(pendingVerifications);
            setNonMembers(members);
        } catch (err) {
            setError(err.response?.data?.message || "Could not load resident dashboard.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const stats = useMemo(() => [
        {
            label: "Total residents",
            value: residentStats.total,
            note: "Across all societies",
            accent: "blue",
            icon: Users
        },
        {
            label: "Active",
            value: residentStats.active,
            note: "Approved and active",
            accent: "green",
            icon: CheckCircle2
        },
        {
            label: "Pending verification",
            value: residentStats.pending + verificationQueue.length,
            note: "Needs review",
            accent: "violet",
            icon: Clock3
        },
        {
            label: "Suspended",
            value: residentStats.suspended,
            note: "Restricted access",
            accent: "orange",
            icon: ShieldAlert
        },
        {
            label: "Blacklisted",
            value: residentStats.blacklisted,
            note: "Blocked entries",
            accent: "red",
            icon: AlertTriangle
        },
        {
            label: "Non-members",
            value: nonMembers.length,
            note: "External stakeholders",
            accent: "slate",
            icon: Building2
        }
    ], [nonMembers.length, residentStats, verificationQueue.length]);

    return (
        <section className="society-dashboard">
            <header className="society-heading">
                <div>
                    <div className="society-eyebrow"><span className="society-eyebrow-dot" /> RESIDENT MANAGEMENT</div>
                    <h1>Resident control center</h1>
                    <p>Track onboarding, verification queues, ownership, and stakeholder health.</p>
                </div>
            </header>

            {error && <div className="society-error" role="alert">{error}</div>}

            <div className="society-stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                {stats.map(({ label, value, note, accent, icon: Icon }) => (
                    <article key={label} className="society-stat-card">
                        <span className={`society-stat-icon society-stat-icon-${accent}`}>
                            <Icon size={19} />
                        </span>
                        <div>
                            <span className="society-stat-label">{label}</span>
                            <strong>{loading ? "—" : value}</strong>
                        </div>
                        <span className="society-stat-note">{note}</span>
                    </article>
                ))}
            </div>

            <section className="society-list-panel" style={{ marginTop: 18 }}>
                <div className="society-list-heading">
                    <div>
                        <h2>Verification queue</h2>
                        <p>Pending resident approvals and requests for more information.</p>
                    </div>
                    <span className="society-count">{loading ? "Loading" : `${verificationQueue.length} pending`}</span>
                </div>

                {loading ? (
                    <div className="society-loading"><span className="society-loader" />Loading resident dashboard...</div>
                ) : verificationQueue.length === 0 ? (
                    <div className="society-empty">
                        <span className="society-empty-icon"><FileText size={24} /></span>
                        <h3>No items in the queue</h3>
                        <p>All verification requests are currently up to date.</p>
                    </div>
                ) : (
                    <div className="society-table-wrap">
                        <table className="society-table">
                            <thead>
                                <tr>
                                    <th>Resident</th>
                                    <th>Verification type</th>
                                    <th>Status</th>
                                    <th>Requested</th>
                                </tr>
                            </thead>
                            <tbody>
                                {verificationQueue.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="society-name-cell">
                                                <span className="society-avatar"><UserRound size={19} /></span>
                                                <span>
                                                    <strong>{item.residentName || item.residentId || "Resident"}</strong>
                                                    <small>{item.reviewType || item.verificationType || "Verification"}</small>
                                                </span>
                                            </div>
                                        </td>
                                        <td>{item.verificationType || item.verification_type || "INITIAL_REGISTRATION"}</td>
                                        <td><span className="society-tax-label">{item.status || "PENDING"}</span></td>
                                        <td>{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </section>
    );
};

export default ResidentDashboardPage;
