import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Edit,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    UserCheck,
    Users,
    UserRound
} from "lucide-react";

import residentApi from "../api/resident.api";
import ResidentForm from "../components/ResidentForm";


const rowsFrom = (response) => {

    const rows =
        Array.isArray(response)
            ? response
            : response?.data ||
              response?.residents ||
              [];

    return Array.isArray(rows)
        ? rows
        : [];
};


const ResidentListPage = () => {

    const [residents, setResidents] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [showForm, setShowForm] =
        useState(false);

    const [editingResident, setEditingResident] =
        useState(null);


    const closeForm = () => {

        setShowForm(false);
        setEditingResident(null);

    };


    const loadResidents = async () => {

        try {

            setLoading(true);
            setError("");

            const response =
                await residentApi.getAll();

            setResidents(
                rowsFrom(response)
            );

        } catch (err) {

            console.error(
                "Load residents error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Could not load residents. Please try again."
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        let isMounted = true;

        residentApi.getAll()

            .then((response) => {

                if (!isMounted) {
                    return;
                }

                setResidents(
                    rowsFrom(response)
                );

            })

            .catch((err) => {

                if (isMounted) {

                    setError(
                        err.response?.data?.message ||
                        "Could not load residents. Please try again."
                    );

                }

            })

            .finally(() => {

                if (isMounted) {
                    setLoading(false);
                }

            });


        return () => {
            isMounted = false;
        };

    }, []);


    useEffect(() => {

        if (!showForm) {
            return undefined;
        }

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow =
            "hidden";


        const handleKeyDown = (event) => {

            if (event.key === "Escape") {
                closeForm();
            }

        };


        window.addEventListener(
            "keydown",
            handleKeyDown
        );


        return () => {

            document.body.style.overflow =
                previousOverflow;

            window.removeEventListener(
                "keydown",
                handleKeyDown
            );

        };

    }, [showForm]);


    const filteredResidents = useMemo(() => {

        const query =
            search
                .trim()
                .toLowerCase();


        if (!query) {
            return residents;
        }


        return residents.filter(
            (resident) => {

                return [
                    resident.firstName,
                    resident.middleName,
                    resident.lastName,
                    resident.displayName,
                    resident.email,
                    resident.mobile,
                    resident.alternateMobile,
                    resident.role,
                    resident.status
                ].some(
                    (value) =>
                        String(value || "")
                            .toLowerCase()
                            .includes(query)
                );

            }
        );

    }, [residents, search]);


    const openCreate = () => {

        setEditingResident(null);
        setShowForm(true);

    };


    const openEdit = (resident) => {

        setEditingResident(resident);
        setShowForm(true);

    };


    const handleDelete = async (resident) => {

        if (
            !window.confirm(
                `Are you sure you want to delete ${resident.displayName || resident.firstName}?`
            )
        ) {
            return;
        }


        try {

            await residentApi.delete(
                resident.id,
                resident.societyId
            );

            await loadResidents();

        } catch (err) {

            window.alert(
                err.response?.data?.message ||
                "Failed to delete resident."
            );

        }

    };


    const handleFormSuccess = async () => {

        closeForm();

        await loadResidents();

    };


    const activeCount =
        residents.filter(
            (resident) =>
                resident.status === "ACTIVE"
        ).length;


    const pendingCount =
        residents.filter(
            (resident) =>
                resident.status === "PENDING"
        ).length;


    return (

        <section className="society-dashboard">

            {/* Heading */}

            <header className="society-heading">

                <div>

                    <div className="society-eyebrow">

                        <span className="society-eyebrow-dot" />

                        RESIDENT MANAGEMENT

                    </div>

                    <h1>
                        Residents
                    </h1>

                    <p>
                        Manage resident profiles, roles,
                        contact details, and stakeholder status.
                    </p>

                </div>


                <button
                    className="society-add-button"
                    onClick={openCreate}
                >

                    <Plus
                        size={18}
                        strokeWidth={2.4}
                    />

                    Add Resident

                </button>

            </header>


            {/* Error */}

            {error && (

                <div
                    className="society-error"
                    role="alert"
                >

                    {error}

                    <button
                        onClick={loadResidents}
                    >
                        Try again
                    </button>

                </div>

            )}


            {/* Stats */}

            <div className="society-stats">

                <article className="society-stat-card">

                    <span className="society-stat-icon society-stat-icon-blue">

                        <Users size={19} />

                    </span>

                    <div>

                        <span className="society-stat-label">
                            Total residents
                        </span>

                        <strong>
                            {loading
                                ? "—"
                                : residents.length}
                        </strong>

                    </div>

                    <span className="society-stat-note">
                        In resident registry
                    </span>

                </article>


                <article className="society-stat-card">

                    <span className="society-stat-icon society-stat-icon-green">

                        <UserCheck size={19} />

                    </span>

                    <div>

                        <span className="society-stat-label">
                            Active residents
                        </span>

                        <strong>
                            {loading
                                ? "—"
                                : activeCount}
                        </strong>

                    </div>

                    <span className="society-stat-note">
                        Currently active
                    </span>

                </article>


                <article className="society-stat-card">

                    <span className="society-stat-icon society-stat-icon-violet">

                        <UserRound size={19} />

                    </span>

                    <div>

                        <span className="society-stat-label">
                            Pending
                        </span>

                        <strong>
                            {loading
                                ? "—"
                                : pendingCount}
                        </strong>

                    </div>

                    <span className="society-stat-note">
                        Awaiting activation
                    </span>

                </article>

            </div>


            {/* Resident List */}

            <section className="society-list-panel">

                <div className="society-list-heading">

                    <div>

                        <h2>
                            Resident directory
                        </h2>

                        <p>
                            View and manage registered residents.
                        </p>

                    </div>


                    <span className="society-count">

                        {loading
                            ? "Loading"
                            : `${filteredResidents.length} ${
                                filteredResidents.length === 1
                                    ? "resident"
                                    : "residents"
                            }`}

                    </span>

                </div>


                {/* Toolbar */}

                <div className="society-toolbar">

                    <label className="society-search">

                        <Search size={17} />

                        <input
                            aria-label="Search residents"
                            placeholder="Search name, mobile, email, role..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />

                        <kbd>
                            ⌕
                        </kbd>

                    </label>


                    <button
                        className="society-refresh-button"
                        onClick={loadResidents}
                        disabled={loading}
                    >

                        <RefreshCw
                            size={16}
                            className={
                                loading
                                    ? "society-spinning"
                                    : ""
                            }
                        />

                        Refresh

                    </button>

                </div>


                {/* Loading */}

                {loading ? (

                    <div className="society-loading">

                        <span className="society-loader" />

                        Loading residents...

                    </div>

                ) : filteredResidents.length === 0 ? (

                    /* Empty */

                    <div className="society-empty">

                        <span className="society-empty-icon">

                            <Users size={24} />

                        </span>

                        <h3>

                            {search
                                ? "No matching residents"
                                : "No residents yet"}

                        </h3>

                        <p>

                            {search
                                ? "Try another name, mobile number, email, or role."
                                : "Add your first resident to start managing the resident directory."}

                        </p>


                        {!search && (

                            <button
                                className="society-add-button"
                                onClick={openCreate}
                            >

                                <Plus size={17} />

                                Add your first resident

                            </button>

                        )}

                    </div>

                ) : (

                    /* Table */

                    <div className="society-table-wrap">

                        <table className="society-table">

                            <thead>

                                <tr>

                                    <th>
                                        Resident
                                    </th>

                                    <th>
                                        Contact
                                    </th>

                                    <th>
                                        Role
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th className="society-actions-heading">
                                        Actions
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredResidents.map(
                                    (resident) => {

                                        const displayName =
                                            resident.displayName ||
                                            [
                                                resident.firstName,
                                                resident.middleName,
                                                resident.lastName
                                            ]
                                                .filter(Boolean)
                                                .join(" ") ||
                                            "Unnamed resident";


                                        return (

                                            <tr
                                                key={resident.id}
                                            >

                                                {/* Resident */}

                                                <td>

                                                    <div className="society-name-cell">

                                                        <span className="society-avatar">

                                                            <UserRound
                                                                size={19}
                                                            />

                                                        </span>


                                                        <span>

                                                            <strong>
                                                                {displayName}
                                                            </strong>

                                                            <small>
                                                                {resident.email ||
                                                                    "Email not added"}
                                                            </small>

                                                        </span>

                                                    </div>

                                                </td>


                                                {/* Contact */}

                                                <td>

                                                    {resident.mobile ? (

                                                        <span className="society-registration">

                                                            {resident.mobile}

                                                        </span>

                                                    ) : (

                                                        <span className="society-muted">
                                                            Not provided
                                                        </span>

                                                    )}

                                                    <br />

                                                    {resident.alternateMobile || (
                                                        <span className="society-muted">
                                                            No alternate number
                                                        </span>
                                                    )}

                                                </td>


                                                {/* Role */}

                                                <td>

                                                    <span className="society-tax-label">

                                                        {(resident.role ||
                                                            "PRIMARY_OWNER")
                                                            .replaceAll(
                                                                "_",
                                                                " "
                                                            )}

                                                    </span>

                                                </td>


                                                {/* Status */}

                                                <td>

                                                    <span
                                                        className={
                                                            resident.status ===
                                                            "ACTIVE"
                                                                ? "society-registration"
                                                                : "society-muted"
                                                        }
                                                    >

                                                        {(resident.status ||
                                                            "PENDING")
                                                            .replaceAll(
                                                                "_",
                                                                " "
                                                            )}

                                                    </span>

                                                </td>


                                                {/* Actions */}

                                                <td>

                                                    <div className="society-row-actions">

                                                        <button
                                                            className="society-icon-action"
                                                            title="Edit resident"
                                                            aria-label={`Edit ${displayName}`}
                                                            onClick={() =>
                                                                openEdit(
                                                                    resident
                                                                )
                                                            }
                                                        >

                                                            <Edit size={16} />

                                                        </button>


                                                        <button
                                                            className="society-icon-action society-delete-action"
                                                            title="Delete resident"
                                                            aria-label={`Delete ${displayName}`}
                                                            onClick={() =>
                                                                handleDelete(
                                                                    resident
                                                                )
                                                            }
                                                        >

                                                            <Trash2 size={16} />

                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>

                                        );

                                    }
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>


            {/* Form Modal */}

            {showForm && (

                <div
                    className="society-modal-layer"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeForm();
                        }

                    }}
                >

                    <ResidentForm
                        key={
                            editingResident?.id ||
                            "new-resident"
                        }
                        resident={
                            editingResident
                        }
                        onClose={
                            closeForm
                        }
                        onSuccess={
                            handleFormSuccess
                        }
                    />

                </div>

            )}

        </section>

    );

};

export default ResidentListPage;
