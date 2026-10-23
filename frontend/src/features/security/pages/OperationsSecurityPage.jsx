import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  AlertOctagon,
  CalendarDays,
  ClipboardCheck,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Siren,
  Users,
  X,
} from "lucide-react";
import securityApi from "../api/security.legacy.api";
import unitApi from "../../units/api/unit.api";
import { recordToSections, RecordDetailsModal } from "../../../components/ui/Modal";

const rowsFrom = (response) => {
  let rows = Array.isArray(response)
    ? response
    : response?.data || response?.records || [];
  if (!Array.isArray(rows) && Array.isArray(rows?.rows)) rows = rows.rows;
  return Array.isArray(rows)
    ? rows.filter((row) => row && typeof row === "object")
    : [];
};
const societyId = () =>
  String(localStorage.getItem("selectedSocietyId") || "")
    .replace(/^:+/, "")
    .trim();
const formatTime = (value) => {
  if (!value) return "—";
  const text = String(value).trim();
  if (/[T ]\d{2}:\d{2}/.test(text)) {
    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
    }
  }
  const match = text.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return text;
  const hour = Number(match[1]);
  const minute = match[2];
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
};
const documentUrl = (filePath) => {
  if (!filePath) return "#";
  if (/^https?:\/\//i.test(filePath)) return filePath;
  const apiBase =
    import.meta.env.VITE_LEGACY_API_BASE_URL ||
    (
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1"
    ).replace(/\/api\/v1\/?$/, "/api");
  return `${apiBase.replace(/\/api\/?$/, "")}${filePath.startsWith("/") ? filePath : `/${filePath}`}`;
};
const localDate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};
const tabs = [
  ["overview", "Overview", Shield],
  ["staff", "Staff & documents", Users],
  ["attendance", "Attendance", ClipboardCheck],
  ["rosters", "Shifts & rosters", CalendarDays],
  ["tasks", "Tasks", Activity],
  ["patrols", "Patrols", MapPin],
  ["incidents", "Incidents", AlertOctagon],
  ["emergencies", "Emergencies", Siren],
  ["gates", "Gates & Visitor Access", Shield],
];
const configs = {
  attendance: {
    title: "Attendance record",
    api: "createAttendance",
    fields: [
      ["staffId", "Staff", "staff"],
      ["attendanceDate", "Attendance date", "date"],
      [
        "status",
        "Status",
        "select",
        ["PRESENT", "ABSENT", "LATE", "HALF_DAY", "ON_LEAVE"],
      ],
      ["checkInTime", "Check in", "time"],
      ["checkOutTime", "Check out", "time"],
      ["workingMinutes", "Working minutes", "number"],
      ["overtimeMinutes", "Overtime minutes", "number"],
      ["remarks", "Remarks"],
    ],
  },
  staff: {
    title: "Staff member",
    api: "createStaff",
    fields: [
      ["employeeCode", "Employee code"],
      ["firstName", "First name"],
      ["lastName", "Last name"],
      ["mobileNumber", "Mobile number"],
      ["email", "Email"],
      ["joiningDate", "Joining date", "date"],
      [
        "staffType",
        "Staff type",
        "select",
        [
          "SECURITY_GUARD",
          "SECURITY_SUPERVISOR",
          "HOUSEKEEPING",
          "MAINTENANCE",
          "ELECTRICIAN",
          "PLUMBER",
          "GARDENER",
          "OTHER",
        ],
      ],
    ],
  },
  assignment: {
    title: "Unit assignment",
    api: "createAssignment",
    fields: [
      ["staffId", "Staff", "staff"],
      ["unitId", "Unit", "unit"],
      [
        "assignmentType",
        "Assignment type",
        "select",
        ["SECURITY", "HOUSEKEEPING", "MAINTENANCE", "SUPPORT", "OTHER"],
      ],
      ["startDate", "Start date", "date"],
      ["endDate", "End date", "date"],
    ],
  },
  document: {
    title: "Upload staff document",
    api: "uploadDocument",
    fields: [
      ["staffId", "Staff", "staff"],
      [
        "documentType",
        "Document type",
        "select",
        [
          "ID_PROOF",
          "PAN",
          "ADDRESS_PROOF",
          "POLICE_VERIFICATION",
          "EMPLOYMENT_PROOF",
          "CONTRACT",
          "MEDICAL_CERTIFICATE",
          "OTHER",
        ],
      ],
      ["file", "Choose document", "file"],
      ["issueDate", "Issue date", "date"],
      ["expiryDate", "Expiry date", "date"],
      ["documentNumber", "Document number"],
      ["remarks", "Notes", "textarea"],
    ],
  },
  shift: {
    title: "Shift",
    api: "createShift",
    fields: [
      ["shiftCode", "Shift code"],
      ["shiftName", "Shift name"],
      [
        "shiftType",
        "Shift type",
        "select",
        ["MORNING", "AFTERNOON", "EVENING", "NIGHT", "GENERAL", "OTHER"],
      ],
      ["startTime", "Start time", "time"],
      ["endTime", "End time", "time"],
      ["breakMinutes", "Break minutes", "number"],
      ["graceMinutes", "Grace minutes", "number"],
    ],
  },
  roster: {
    title: "Roster Entry",
    api: "createRoster",
    fields: [
      ["staffId", "Staff", "staff"],
      ["shiftId", "Shift", "shift"],
      ["rosterDate", "Roster date", "date"],
      ["rosterType", "Roster type", "select", ["DAILY", "WEEKLY", "MONTHLY"]],
    ],
  },
  task: {
    title: "Staff task",
    api: "createTask",
    fields: [
      ["staffId", "Staff", "staff"],
      ["title", "Title"],
      ["description", "Description", "textarea"],
      [
        "taskType",
        "Task type",
        "select",
        [
          "SECURITY",
          "HOUSEKEEPING",
          "MAINTENANCE",
          "INSPECTION",
          "PATROL",
          "EMERGENCY",
          "OTHER",
        ],
      ],
      ["priority", "Priority", "select", ["LOW", "MEDIUM", "HIGH", "URGENT"]],
      ["dueDate", "Due date", "date"],
    ],
  },
  checkpoint: {
    title: "Patrol checkpoint",
    api: "createCheckpoint",
    fields: [
      ["checkpointCode", "Checkpoint code"],
      ["checkpointName", "Checkpoint name"],
      ["locationName", "Location"],
      ["sequenceOrder", "Sequence", "number"],
      [
        "verificationMethod",
        "Verification method",
        "select",
        ["QR", "NFC", "GPS", "QR_NFC", "QR_GPS", "NFC_GPS", "QR_NFC_GPS"],
      ],
      ["gpsLatitude", "GPS latitude", "number"],
      ["gpsLongitude", "GPS longitude", "number"],
      ["gpsRadiusMeters", "GPS radius (m)", "number"],
    ],
  },
  patrol: {
    title: "Patrol",
    api: "createPatrol",
    fields: [
      ["staffId", "Staff", "staff"],
      ["patrolCode", "Patrol code"],
      ["patrolName", "Patrol name"],
      ["patrolDate", "Patrol date", "date"],
      ["plannedStartTime", "Planned start", "time"],
      ["plannedEndTime", "Planned end", "time"],
    ],
  },
  incident: {
    title: "Incident",
    api: "createIncident",
    fields: [
      ["incidentNumber", "Incident number"],
      [
        "incidentType",
        "Type",
        "select",
        [
          "SECURITY_BREACH",
          "THEFT",
          "FIRE",
          "MEDICAL",
          "ACCIDENT",
          "FIGHT",
          "VANDALISM",
          "UNAUTHORIZED_ACCESS",
          "VEHICLE",
          "PROPERTY_DAMAGE",
          "SAFETY_HAZARD",
          "OTHER",
        ],
      ],
      ["title", "Title"],
      ["description", "Description", "textarea"],
      ["incidentDate", "Date and time", "datetime-local"],
      ["severity", "Severity", "select", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]],
      ["priority", "Priority", "select", ["LOW", "MEDIUM", "HIGH", "URGENT"]],
      ["location", "Location"],
    ],
  },
  emergency: {
    title: "Emergency / SOS",
    api: "createEmergency",
    fields: [
      ["emergencyNumber", "Emergency number"],
      [
        "emergencyType",
        "Type",
        "select",
        [
          "FIRE",
          "MEDICAL",
          "SECURITY_BREACH",
          "THEFT",
          "ACCIDENT",
          "ELECTRICAL",
          "WATER_LEAKAGE",
          "FLOOD",
          "GAS_LEAK",
          "MISSING_PERSON",
          "NATURAL_DISASTER",
          "VIOLENCE",
          "OTHER",
        ],
      ],
      ["title", "Title"],
      ["description", "Description", "textarea"],
      ["priority", "Priority", "select", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]],
      ["location", "Location"],
    ],
  },
};
const titleCase = (value) => {
  if (!value) return "";

  let label = String(value)
    // camelCase → camel Case
    .replace(/([a-z])([A-Z])/g, "$1 $2")

    // PascalCase → Pascal Case
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")

    // snake_case / kebab-case / spaces → spaces
    .replace(/[_-]+/g, " ")

    // Handle concatenated "id", "url", "api"
    .replace(/id$/i, " ID")
    .replace(/url$/i, " URL")
    .replace(/api$/i, " API")

    // Remove extra spaces
    .replace(/\s+/g, " ")
    .trim();

  // Capitalize each word
  label = label.replace(/\b[a-z]/g, (char) => char.toUpperCase());

  // Preserve common abbreviations
  label = label
    .replace(/\bId\b/g, "ID")
    .replace(/\bUrl\b/g, "URL")
    .replace(/\bApi\b/g, "API");

  return label;
};
const display = (value) =>
  value == null || value === ""
    ? "—"
    : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);

export default function SecurityPage() {
  const { section } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(section || "overview");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState("");
  const [busy, setBusy] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [viewingStaff, setViewingStaff] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const keys = [
        "staff",
        "assignments",
        "documents",
        "attendance",
        "shifts",
        "rosters",
        "tasks",
        "checkpoints",
        "patrols",
        "incidents",
        "emergencies",
        "audits",
        "units",
      ];
      const methods = [
        securityApi.getStaff,
        securityApi.getAssignments,
        securityApi.getDocuments,
        securityApi.getAttendance,
        securityApi.getShifts,
        securityApi.getRosters,
        securityApi.getTasks,
        securityApi.getCheckpoints,
        securityApi.getPatrols,
        securityApi.getIncidents,
        securityApi.getEmergencies,
        securityApi.getAudits,
        unitApi.getAll,
      ];
      const results = await Promise.allSettled(
        methods.map((method) => method()),
      );
      const next = {};
      const failed = [];
      results.forEach((result, index) => {
        const key = keys[index];
        if (result.status === "fulfilled") next[key] = rowsFrom(result.value);
        else {
          next[key] = [];
          failed.push(key);
        }
      });
      setData(next);
      if (failed.length)
        setError(
          `Could not load: ${failed.join(", ")}. Check the API connection and retry.`,
        );
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not load security records.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, []);
  useEffect(() => {
    setTab(section || "overview");
  }, [section]);
  useEffect(() => {
    if (!form && !editRecord && !workflow) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setForm("");
        setEditRecord(null);
        setWorkflow(null);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [form, editRecord, workflow]);
  const staff = data.staff || [];
  const units = data.units || [];
  const stats = [
    [
      "Active staff",
      staff.filter((item) => item.status === "ACTIVE").length,
      Users,
    ],
    [
      "On duty today",
      (data.attendance || []).filter(
        (item) => item.status === "PRESENT" || item.status === "LATE",
      ).length,
      ClipboardCheck,
    ],
    [
      "Open incidents",
      (data.incidents || []).filter(
        (item) => !["CLOSED", "RESOLVED", "REJECTED"].includes(item.status),
      ).length,
      AlertOctagon,
    ],
    [
      "Active emergencies",
      (data.emergencies || []).filter(
        (item) =>
          !["CLOSED", "RESOLVED", "CANCELLED", "FALSE_ALARM"].includes(
            item.status,
          ),
      ).length,
      Siren,
    ],
  ];
  const sectionKey = {
    staff: "staff",
    attendance: "attendance",
    rosters: "rosters",
    tasks: "tasks",
    patrols: "patrols",
    incidents: "incidents",
    emergencies: "emergencies",
    audit: "audits",
  }[tab];
  const items = data[sectionKey] || [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (item) =>
        !q ||
        Object.values(item).map(display).join(" ").toLowerCase().includes(q),
    );
  }, [items, search]);
  const save = async (event) => {
    event.preventDefault();
    const config = configs[form];
    const formData = new FormData(event.currentTarget);
    const payload =
      form === "document" ? formData : Object.fromEntries(formData.entries());
    if (form === "document" && !formData.get("file")?.size) {
      setFormError("Choose a document file to upload.");
      return;
    }
    if (form === "document" && formData.get("file").size > 25 * 1024 * 1024) {
      setFormError("The selected file is larger than the 25 MB upload limit.");
      return;
    }
    [
      "breakMinutes",
      "graceMinutes",
      "sequenceOrder",
      "gpsLatitude",
      "gpsLongitude",
      "gpsRadiusMeters",
    ].forEach((key) => {
      if (payload[key] !== undefined && payload[key] !== "")
        payload[key] = Number(payload[key]);
    });
    if (
      [
        "staff",
        "shift",
        "roster",
        "task",
        "checkpoint",
        "patrol",
        "incident",
        "emergency",
      ].includes(form)
    )
      payload.societyId = societyId();
    setBusy(true);
    try {
      await securityApi[config.api](payload);
      setFormError("");
      setForm("");
      await loadData();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        `Could not save ${config.title.toLowerCase()}.`;
      setError(message);
      setFormError(message);
    } finally {
      setBusy(false);
    }
  };
  const act = async (fn, ...args) => {
    try {
      setBusy(true);
      await fn(...args);
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || "That action could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  };
  const resourceFor = {
    staff: "staff",
    attendance: "staff-attendance",
    rosters: "rosters",
    tasks: "staff-tasks",
    patrols: "patrols",
    incidents: "incidents",
    emergencies: "emergencies",
    audit: "security-audits",
  }[tab];
  const staffName = (id) => {
    const person = staff.find((item) => String(item.id) === String(id));
    return person
      ? `${person.firstName || ""} ${person.lastName || ""}`.trim()
      : display(id);
  };
  const shiftName = (id) =>
    data.shifts?.find((shift) => String(shift.id) === String(id))?.shiftName || display(id);
  const actionsFor = (item) => {
    const id = item.id;
    if (tab === "staff")
      return (
        <button
          onClick={() =>
            act(
              item.status === "ACTIVE"
                ? securityApi.deactivateStaff
                : securityApi.activateStaff,
              id,
            )
          }
        >
          {item.status === "ACTIVE" ? "Deactivate" : "Activate"}
        </button>
      );
    if (tab === "patrols")
      return (
        <button
          className="security-manage-button"
          onClick={async () => {
            try {
              const response = await securityApi.getPatrolCheckpoints(id);
              setWorkflow({ type: tab, item, checkpoints: rowsFrom(response) });
            } catch (err) {
              setError(
                err.response?.data?.message ||
                  "Could not load patrol checkpoints.",
              );
            }
          }}
        >
          Manage
        </button>
      );
    if (["rosters", "tasks", "incidents", "emergencies"].includes(tab))
      return (
        <button
          className="security-manage-button"
          onClick={() => setWorkflow({ type: tab, item })}
        >
          Manage
        </button>
      );
    return null;
  };
  const headings = {
    staff: ["Employee", "Type", "Contact", "Joined", "Status"],
    attendance: ["Staff", "Date", "Check in", "Check out", "Status"],
    rosters: ["Staff", "Shift", "Date", "Type", "Status"],
    tasks: ["Title", "Staff", "Type", "Due", "Priority", "Status"],
    patrols: ["Patrol", "Staff", "Date", "Window", "Status"],
    incidents: ["Number", "Incident", "Severity", "Location", "Status"],
    emergencies: ["Number", "Emergency", "Priority", "Location", "Status"],
    audit: ["When", "Module", "Action", "Actor", "Severity"],
  };
  const cells = (item) =>
    ({
      staff: [
        `${item.firstName || ""} ${item.lastName || ""}`.trim(),
        titleCase(item.staffType),
        item.mobileNumber,
        item.joiningDate?.slice(0, 10),
        titleCase(item.status),
      ],
      attendance: [
        staffName(item.staffId),
        item.attendanceDate?.slice(0, 10),
        formatTime(item.checkInTime),
        formatTime(item.checkOutTime),
        titleCase(item.status),
      ],
      rosters: [
        staffName(item.staffId),
        shiftName(item.shiftId),
        item.rosterDate?.slice(0, 10),
        titleCase(item.rosterType),
        titleCase(item.status),
      ],
      tasks: [
        item.title,
        staffName(item.staffId),
        titleCase(item.taskType),
        item.dueDate?.slice(0, 10),
        titleCase(item.priority),
        titleCase(item.status),
      ],
      patrols: [
        item.patrolName,
        staffName(item.staffId),
        item.patrolDate?.slice(0, 10),
        `${item.plannedStartTime || "—"} – ${item.plannedEndTime || "—"}`,
        titleCase(item.status),
      ],
      incidents: [
        item.incidentNumber,
        <>
          <strong>{item.title}</strong>
        </>,
        titleCase(item.severity),
        display(item.location),
        titleCase(item.status),
      ],
      emergencies: [
        item.emergencyNumber,
        <>
          <strong>{item.title}</strong>
        </>,
        titleCase(item.priority),
        display(item.location),
        titleCase(item.status),
      ],
      audit: [
        item.createdAt?.slice(0, 16)?.replace("T", " "),
        titleCase(item.module),
        titleCase(item.action),
        display(item.performedBy || item.userId),
        titleCase(item.severity),
      ],
    })[tab] || [];
  return (
    <section className="society-dashboard security-page">
      <header className="society-heading">
        <div>
          <div className="society-eyebrow">
            <span className="society-eyebrow-dot" /> SECURITY OPERATIONS
          </div>
          <h1>Security & staff</h1>
          <p>
            Manage staff, duty coverage, patrol verification, incidents, and
            emergency response.
          </p>
        </div>
        <button
          className="society-add-button"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </header>
      {error && (
        <div className="society-error" role="alert">
          {error}
          <button onClick={loadData}>Try again</button>
        </div>
      )}
      <nav className="security-tabs" aria-label="Security sections">
        {tabs.map(([key, label, Icon]) => (
          <button
            key={key}
            className={tab === key ? "active" : ""}
            onClick={() => {
              if (key === "gates") {
                navigate("/security");
                return;
              }
              setTab(key);
              setSearch("");
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>
      {tab === "overview" ? (
        <>
          <div className="society-stats">
            {stats.map(([label, count, Icon]) => (
              <article className="society-stat-card" key={label}>
                <span className="society-stat-icon society-stat-icon-blue">
                  <Icon size={19} />
                </span>
                <div>
                  <span className="society-stat-label">{label}</span>
                  <strong>{loading ? "—" : count}</strong>
                </div>
              </article>
            ))}
          </div>
          <div className="society-lifecycle-grid">
            {[
              ["Patrols", "patrols", "patrols"],
              ["Incidents", "incidents", "incidents"],
              ["Emergency calls", "emergencies", "emergencies"],
              ["Staff tasks", "tasks", "tasks"],
            ].map(([label, key, route]) => (
              <button
                className="security-quick-card"
                key={key}
                onClick={() => setTab(route)}
              >
                <span>{label}</span>
                <strong>{(data[key] || []).length}</strong>
                <small>Open {label.toLowerCase()} →</small>
              </button>
            ))}
          </div>
        </>
      ) : (
        <section className="society-list-panel">
          <div className="society-list-heading">
            <div>
              <h2>{tabs.find(([key]) => key === tab)?.[1]}</h2>
              <p>
                {tab === "audit"
                  ? "Recorded changes and operational events across security workflows."
                  : "Review records and take actions for the selected workflow."}
              </p>
            </div>
            <span className="society-count">
              {loading ? "Loading" : `${filtered.length} records`}
            </span>
          </div>
          <div className="society-toolbar">
            <label className="society-search">
              <Search size={17} />
              <input
                aria-label="Search records"
                placeholder="Search records"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            {tab === "attendance" && (
              <>
                <select id="attendance-staff">
                  <option value="">Select staff</option>
                  {staff.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.firstName} {person.lastName}
                    </option>
                  ))}
                </select>
                {[
                  ["checkIn", "Check in"],
                  ["checkOut", "Check out"],
                  ["markAbsent", "Mark absent"],
                  ["markLeave", "Mark leave"],
                ].map(([action, label]) => (
                  <button
                    className="society-workflow-action"
                    key={action}
                    onClick={() => {
                      const staffId =
                        document.getElementById("attendance-staff").value;
                      if (staffId)
                        act(securityApi[action], {
                          staffId,
                          attendanceDate: localDate(),
                        });
                    }}
                  >
                    {label}
                  </button>
                ))}
                <button
                  className="society-add-button"
                  onClick={() => setForm("attendance")}
                >
                  Add attendance
                </button>
              </>
            )}
            {tab === "rosters" && (
              <button
                className="society-add-button"
                onClick={() => setForm("shift")}
              >
                <Plus size={16} /> Add shift
              </button>
            )}
            {Object.hasOwn(
              configs,
              {
                staff: "staff",
                rosters: "roster",
                tasks: "task",
                patrols: "patrol",
                incidents: "incident",
                emergencies: "emergency",
              }[tab],
            ) && (
              <button
                className="society-add-button"
                onClick={() =>
                  setForm(
                    {
                      staff: "staff",
                      rosters: "roster",
                      tasks: "task",
                      patrols: "patrol",
                      incidents: "incident",
                      emergencies: "emergency",
                    }[tab],
                  )
                }
              >
                <Plus size={16} /> Add{" "}
                {tab === "staff"
                  ? "staff"
                  : tab === "rosters"
                    ? "roster"
                    : tab.slice(0, -1)}
              </button>
            )}
            {tab === "patrols" && (
              <button
                className="society-workflow-action"
                onClick={() => setForm("checkpoint")}
              >
                + Add checkpoint
              </button>
            )}
          </div>
          {tab === "staff" && (
            <StaffExtras
              data={data}
              act={act}
              setForm={setForm}
              setEditRecord={setEditRecord}
            />
          )}
          {tab === "rosters" && (
            <section className="security-shifts">
              <h3>Shift definitions</h3>
              {(data.shifts || []).map((shift) => (
                <article key={shift.id}>
                  <strong>{shift.shiftName}</strong>
                  <span>
                    {shift.startTime}–{shift.endTime} ·{" "}
                    {titleCase(shift.shiftType)}
                  </span>
                  <em>{titleCase(shift.status)}</em>
                  <button
                    onClick={() =>
                      act(
                        shift.status === "ACTIVE"
                          ? securityApi.deactivateShift
                          : securityApi.activateShift,
                        shift.id,
                      )
                    }
                  >
                    {shift.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() =>
                      setEditRecord({ item: shift, tab: "shifts" })
                    }
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      window.confirm("Delete this shift?") &&
                      act(securityApi.deleteShift, shift.id)
                    }
                  >
                    Delete
                  </button>
                </article>
              ))}
              {!data.shifts?.length && <small>No shifts configured.</small>}
            </section>
          )}
          {tab === "patrols" && (
            <section className="security-shifts">
              <h3>Checkpoint register</h3>
              {(data.checkpoints || []).map((checkpoint) => (
                <article key={checkpoint.id}>
                  <strong>
                    {checkpoint.checkpointCode} · {checkpoint.checkpointName}
                  </strong>
                  <span>
                    {checkpoint.locationName} ·{" "}
                    {titleCase(checkpoint.verificationMethod)}
                  </span>
                  <em>{titleCase(checkpoint.status)}</em>
                  <button
                    onClick={() =>
                      act(
                        checkpoint.status === "ACTIVE"
                          ? (id) =>
                              securityApi.updateResource("checkpoints", id, {
                                status: "INACTIVE",
                              })
                          : (id) =>
                              securityApi.updateResource("checkpoints", id, {
                                status: "ACTIVE",
                              }),
                        checkpoint.id,
                      )
                    }
                  >
                    {checkpoint.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() =>
                      setEditRecord({ item: checkpoint, tab: "checkpoints" })
                    }
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      window.confirm("Delete this checkpoint?") &&
                      act(securityApi.deleteCheckpoint, checkpoint.id)
                    }
                  >
                    Delete
                  </button>
                </article>
              ))}
              {!data.checkpoints?.length && (
                <small>No checkpoints configured.</small>
              )}
            </section>
          )}
          {loading ? (
            <div className="society-loading">Loading security records…</div>
          ) : filtered.length === 0 ? (
            <div className="society-empty">
              <h3>No records found</h3>
              <p>Create a record or adjust your search.</p>
            </div>
          ) : (
            <div className="society-table-wrap">
              <table className="society-table">
                <thead>
                  <tr>
                    {(headings[tab] || []).map((heading) => (
                      <th key={heading}>{heading}</th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      {cells(item).map((value, index) => (
                        <td key={index}>{tab === "staff" && index === 0 ? <button type="button" className="record-details-trigger" onClick={() => setViewingStaff(item)}>{value}</button> : value}</td>
                      ))}
                      <td>
                        <div className="society-row-actions">
                          {actionsFor(item)}
                          {tab !== "audit" && (
                            <button
                              onClick={() => setEditRecord({ item, tab })}
                            >
                              Edit
                            </button>
                          )}
                          {(tab !== "audit" ||
                            resourceFor === "security-audits") && (
                            <button
                              className="society-delete-action"
                              onClick={() =>
                                window.confirm(
                                  `Delete this ${tabs.find(([key]) => key === tab)?.[1].toLowerCase()} record?`,
                                ) &&
                                act(
                                  resourceFor === "staff"
                                    ? securityApi.deleteStaff
                                    : (id) =>
                                        securityApi.deleteResource(
                                          resourceFor,
                                          id,
                                        ),
                                  item.id,
                                )
                              }
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
      {form && (
        <div
          className="society-modal-layer"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setForm("");
          }}
        >
          <section className="society-form-modal">
            <header className="security-modal-header">
              <div>
                <h2>{configs[form]?.title}</h2>
                <p>Enter the record details below.</p>
              </div>
              <button aria-label="Close" onClick={() => setForm("")}>
                <X size={18} />
              </button>
            </header>
            <form onSubmit={save}>
              <div className="security-form-grid">
                {(configs[form]?.fields || []).map(
                  ([name, label, type = "text", options]) => (
                    <label key={name}>
                      {label}
                      {type === "select" ? (
                        <select name={name} required={name !== "shiftType"}>
                          <option value="">Select {label.toLowerCase()}</option>
                          {options.map((option) => (
                            <option key={option} value={option}>
                              {titleCase(option)}
                            </option>
                          ))}
                        </select>
                      ) : type === "staff" ? (
                        <select name={name} required>
                          <option value="">Select staff member</option>
                          {staff.map((person) => (
                            <option key={person.id} value={person.id}>
                              {person.firstName} {person.lastName} ·{" "}
                              {person.employeeCode}
                            </option>
                          ))}
                        </select>
                      ) : type === "unit" ? (
                        <select name={name} required disabled={!units.length}>
                          <option value="">
                            {units.length
                              ? "Select unit"
                              : "No units available"}
                          </option>
                          {units.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                              {unit.unitNumber || unit.name || unit.id}
                            </option>
                          ))}
                        </select>
                      ) : type === "shift" ? (
                        <select name={name} required>
                          <option value="">Select shift</option>
                          {(data.shifts || []).map((shift) => (
                            <option key={shift.id} value={shift.id}>
                              {shift.shiftName} · {shift.startTime}–
                              {shift.endTime}
                            </option>
                          ))}
                        </select>
                      ) : type === "textarea" ? (
                        <textarea
                          name={name}
                          rows="3"
                          required={name === "description"}
                        />
                      ) : (
                        <input
                          name={name}
                          type={type}
                          required={
                            ![
                              "lastName",
                              "email",
                              "endDate",
                              "dueDate",
                              "location",
                              "gpsLatitude",
                              "gpsLongitude",
                              "gpsRadiusMeters",
                              "breakMinutes",
                              "graceMinutes",
                              "checkInTime",
                              "checkOutTime",
                              "workingMinutes",
                              "overtimeMinutes",
                              "remarks",
                            ].includes(name)
                          }
                        />
                      )}
                    </label>
                  ),
                )}
              </div>
              <footer className="security-modal-footer">
                <button type="button" onClick={() => setForm("")}>
                  Cancel
                </button>
                <button className="society-add-button" disabled={busy}>
                  {busy ? "Saving…" : "Save record"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
      {formError && form === "document" && (
        <div className="security-upload-error" role="alert">
          {formError}
        </div>
      )}
      {editRecord && (
        <RecordEditModal
          record={editRecord.item}
          tab={editRecord.tab}
          staff={staff}
          units={units}
          onClose={() => setEditRecord(null)}
          onSave={async (id, sectionName, patchData) => {
            const resource = {
              staff: "staff",
              attendance: "staff-attendance",
              rosters: "rosters",
              tasks: "staff-tasks",
              patrols: "patrols",
              incidents: "incidents",
              emergencies: "emergencies",
              shifts: "shifts",
              checkpoints: "checkpoints",
              documents: "staff-documents",
              assignments: "staff-unit-assignments",
            }[sectionName];
            await act(
              (key, body) => securityApi.updateResource(resource, key, body),
              id,
              patchData,
            );
            setEditRecord(null);
          }}
        />
      )}
      {viewingStaff && <RecordDetailsModal title={`${viewingStaff.firstName || ""} ${viewingStaff.lastName || ""}`.trim() || "Staff profile"} subtitle="Staff member profile and employment information" icon={Users} record={viewingStaff} sections={recordToSections(viewingStaff)} onClose={() => setViewingStaff(null)} />}
      {workflow && (
        <SecurityWorkflowDialog
          workflow={workflow}
          staff={staff}
          checkpoints={data.checkpoints || []}
          patrolCheckpoints={workflow.checkpoints || []}
          busy={busy}
          onClose={() => setWorkflow(null)}
          onSubmit={async (action, payload, checkpointId) => {
            const { type, item } = workflow;
            if (type === "patrols") {
              if (["verify", "missed"].includes(action)) {
                setBusy(true);
                try {
                  const alreadyAssigned = (workflow.checkpoints || []).some(
                    (stop) => String(stop.checkpointId || stop.id) === String(checkpointId),
                  );
                  if (!alreadyAssigned) {
                    await securityApi.addPatrolCheckpoint(item.id, { checkpointId });
                  }
                  if (action === "verify")
                    await securityApi.verifyCheckpoint(item.id, checkpointId, payload);
                  else await securityApi.missCheckpoint(item.id, checkpointId, payload);
                  await loadData();
                } finally {
                  setBusy(false);
                }
              }
              else if (action === "add-checkpoint")
                await act(securityApi.addPatrolCheckpoint, item.id, {
                  checkpointId,
                });
              else await act(securityApi.patrolAction, item.id, action);
            } else if (type === "tasks")
              await act(securityApi.taskAction, item.id, action, payload);
            else if (type === "rosters")
              await act(securityApi.rosterAction, item.id, action);
            else
              await act(
                type === "incidents"
                  ? securityApi.incidentAction
                  : securityApi.emergencyAction,
                item.id,
                action,
                payload,
              );
            setWorkflow(null);
          }}
        />
      )}
    </section>
  );
}

function RecordEditModal({ record, tab, staff, units, onClose, onSave }) {
  const editable = Object.fromEntries(
    Object.entries(record).filter(
      ([key, value]) =>
        !["id", "createdAt", "updatedAt", "deletedAt"].includes(key) &&
        (value == null ||
          ["string", "number", "boolean"].includes(typeof value)),
    ),
  );
  const [values, setValues] = useState(editable);
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        value === "" ? null : value,
      ]),
    );
    try {
      await onSave(record.id, tab, payload);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save this record.");
    }
  };
  return (
    <div
      className="society-modal-layer"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="society-form-modal">
        <header className="security-modal-header">
          <div>
            <h2>Edit {titleCase(tab)} record</h2>
            <p>Update record details and save your changes.</p>
          </div>
          <button aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <form onSubmit={submit}>
          <div className="security-form-grid">
            {Object.entries(values).map(([key, value]) => (
              <label key={key}>
                {titleCase(key)}
                {tab === "assignments" && key === "unitId" ? (
                  <select
                    value={value ?? ""}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                  >
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.unitNumber || unit.name || unit.id}
                      </option>
                    ))}
                  </select>
                ) : tab === "assignments" && key === "staffId" ? (
                  <select
                    value={value ?? ""}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                  >
                    {staff.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.firstName} {person.lastName} ·{" "}
                        {person.employeeCode}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={value ?? ""}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                  />
                )}
              </label>
            ))}
          </div>
          {error && (
            <p className="security-form-error" role="alert">
              {error}
            </p>
          )}
          <footer className="security-modal-footer">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="society-add-button">Save changes</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function SecurityWorkflowDialog({
  workflow,
  staff,
  checkpoints,
  patrolCheckpoints,
  busy,
  onClose,
  onSubmit,
}) {
  const { type, item } = workflow;
  const [action, setAction] = useState(
    type === "patrols"
      ? "verify"
      : type === "tasks"
        ? "start"
        : type === "rosters"
          ? "confirm"
          : "acknowledge",
  );
  const [gps, setGps] = useState(null);
  const [error, setError] = useState("");
  const checkpointLabel = (stop) => {
    const checkpointId = stop.checkpointId || stop.id;
    const checkpoint = checkpoints.find((item) => String(item.id) === String(checkpointId));
    return [
      stop.checkpointName || stop.checkpoint?.checkpointName || checkpoint?.checkpointName,
      stop.locationName || stop.checkpoint?.locationName || checkpoint?.locationName,
    ].filter(Boolean).join(" · ") || checkpoint?.checkpointCode || "Checkpoint";
  };
  const actionOptions =
    type === "patrols"
      ? [
          ["verify", "Verify checkpoint"],
          ["missed", "Mark checkpoint missed"],
          ["add-checkpoint", "Add checkpoint to patrol"],
          ["start", "Start patrol"],
          ["complete", "Complete patrol"],
          ["cancel", "Cancel patrol"],
        ]
      : type === "tasks"
        ? [
            ["start", "Start task"],
            ["complete", "Complete task"],
            ["overdue", "Mark overdue"],
            ["cancel", "Cancel task"],
          ]
        : type === "rosters"
          ? [
              ["confirm", "Confirm roster"],
              ["complete", "Complete roster"],
              ["cancel", "Cancel roster"],
            ]
          : type === "incidents"
            ? [
                ["acknowledge", "Acknowledge"],
                ["assign", "Assign staff"],
                ["investigate", "Start investigation"],
                ["resolve", "Resolve incident"],
                ["close", "Close incident"],
                ["reject", "Reject report"],
              ]
            : [
                ["acknowledge", "Acknowledge"],
                ["assign", "Assign staff"],
                ["respond", "Start response"],
                ["external-contacts", "Update external contacts"],
                ["resolve", "Resolve emergency"],
                ["close", "Close emergency"],
                ["cancel", "Cancel emergency"],
                ["false-alarm", "Mark false alarm"],
              ];
  const submit = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );
    let payload = {};
    if (action === "assign") payload = { staffId: values.staffId };
    if (action === "investigate")
      payload = { investigationNotes: values.notes };
    if (action === "resolve") payload = { resolutionDetails: values.notes };
    if (action === "respond") payload = { responseNotes: values.notes };
    if (["cancel", "false-alarm", "missed"].includes(action))
      payload = { remarks: values.notes };
    if (action === "external-contacts")
      payload = {
        policeContacted: values.police === "on",
        ambulanceContacted: values.ambulance === "on",
        fireBrigadeContacted: values.fire === "on",
      };
    if (action === "verify")
      payload = {
        verificationMethod: values.method,
        verificationReference: values.reference,
        remarks: values.notes,
        ...(gps || {}),
      };
    try {
      await onSubmit(action, payload, values.checkpointId);
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not complete this action.",
      );
    }
  };
  const captureGps = () => {
    if (!navigator.geolocation) {
      setError("This browser does not support location access.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setError("");
      },
      () => setError("Location permission was denied."),
    );
  };
  const needsNotes = [
    "investigate",
    "resolve",
    "respond",
    "cancel",
    "false-alarm",
    "missed",
    "verify",
  ].includes(action);
  return (
    <div
      className="society-modal-layer"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="society-form-modal security-workflow-modal">
        <header className="security-modal-header">
          <div>
            <div className="society-eyebrow">
              <span className="society-eyebrow-dot" />
              {titleCase(type)}
            </div>
            <h2>{item.title || item.patrolName || "Manage record"}</h2>
            <p>
              {item.location ||
                item.locationName ||
                item.incidentNumber ||
                item.emergencyNumber ||
                "Select an action for this record."}
            </p>
          </div>
          <button aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <form onSubmit={submit}>
          <div className="security-workflow-body">
            <label className="security-field">
              Action
              <select
                value={action}
                onChange={(event) => {
                  setAction(event.target.value);
                  setError("");
                }}
              >
                {actionOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {action === "assign" && (
              <label className="security-field">
                Assign to
                <select name="staffId" required>
                  <option value="">Choose staff member</option>
                  {staff.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.firstName} {person.lastName} ·{" "}
                      {person.employeeCode}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {["verify", "missed"].includes(action) && (
              <label className="security-field">
                Checkpoint
                <select name="checkpointId" required>
                  <option value="" disabled>
                    {checkpoints.some((stop) => stop.status === "ACTIVE") ? "Choose checkpoint" : "No active checkpoints configured"}
                  </option>
                  {checkpoints.filter((stop) => stop.status === "ACTIVE").map((stop) => (
                    <option key={stop.id} value={stop.checkpointId || stop.id}>
                      {checkpointLabel(stop)}
                    </option>
                  ))}
                </select>
                <small>Choose a checkpoint for this patrol. If it is not assigned yet, it will be added automatically.</small>
              </label>
            )}
            {action === "add-checkpoint" && (
              <label className="security-field">
                Checkpoint
                <select name="checkpointId" required>
                  <option value="" disabled>
                    {checkpoints.length ? "Choose checkpoint" : "No checkpoints configured"}
                  </option>
                  {checkpoints.filter((stop) => stop.status === "ACTIVE").map((stop) => (
                    <option key={stop.id} value={stop.id}>
                      {checkpointLabel(stop)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {action === "verify" && (
              <>
                <label className="security-field">
                  Verification method
                  <select name="method">
                    <option>QR</option>
                    <option>NFC</option>
                    <option>GPS</option>
                  </select>
                </label>
                <button
                  type="button"
                  className="security-location-button"
                  onClick={captureGps}
                >
                  <MapPin size={15} />
                  {gps ? "Location captured" : "Use current GPS location"}
                </button>
                <label className="security-field">
                  QR / NFC reference
                  <input
                    name="reference"
                    placeholder="Enter scanned or tag reference"
                  />
                </label>
              </>
            )}
            {action === "external-contacts" && (
              <div className="security-checkboxes">
                {[
                  ["police", "Police contacted"],
                  ["ambulance", "Ambulance contacted"],
                  ["fire", "Fire brigade contacted"],
                ].map(([name, label]) => (
                  <label key={name}>
                    <input type="checkbox" name={name} />
                    {label}
                  </label>
                ))}
              </div>
            )}
            {needsNotes && (
              <label className="security-field">
                {action === "resolve"
                  ? "Resolution details"
                  : action === "investigate"
                    ? "Investigation notes"
                    : action === "respond"
                      ? "Response notes"
                      : action === "verify"
                        ? "Visit notes"
                        : "Reason / remarks"}
                <textarea
                  name="notes"
                  rows="3"
                  required={action !== "verify"}
                />
              </label>
            )}
            {error && (
              <p className="security-form-error" role="alert">
                {error}
              </p>
            )}
          </div>
          <footer className="security-modal-footer">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="society-add-button" disabled={busy}>
              {busy ? "Applying…" : "Apply action"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function StaffExtras({ data, act, setForm, setEditRecord }) {
  const staff = data.staff || [];
  const units = data.units || [];

  const getStaffName = (staffId) => {
    const person = staff.find((item) => String(item.id) === String(staffId));

    return person
      ? `${person.firstName || ""} ${person.lastName || ""}`.trim()
      : "Unknown staff";
  };

  const getUnitName = (unitId) => {
    const unit = units.find((item) => String(item.id) === String(unitId));

    return unit?.unitNumber || unit?.name || "Unknown unit";
  };
  return (
    <div className="security-subpanels">
      <section>
        <h3>
          Unit mapping
          <button onClick={() => setForm("assignment")}>Add mapping</button>
        </h3>

        <div>
          {(data.assignments || []).map((item) => (
            <p key={item.id}>
              <strong>
                {item.staff
                  ? `${item.staff.firstName || ""} ${item.staff.lastName || ""}`.trim()
                  : getStaffName(item.staffId)}
              </strong>

              <span>
                {item.unit
                  ? item.unit.unitNumber || item.unit.name
                  : getUnitName(item.unitId)}
              </span>

              <span className="security-extra-status">
                {titleCase(item.status)}
              </span>

              <button
                onClick={() =>
                  act(
                    securityApi.assignmentAction,
                    item.id,
                    item.status === "ACTIVE" ? "deactivate" : "activate",
                  )
                }
              >
                {item.status === "ACTIVE" ? "End" : "Activate"}
              </button>

              <button
                onClick={() =>
                  setEditRecord({
                    item,
                    tab: "assignments",
                  })
                }
              >
                Edit
              </button>

              <button
                onClick={() =>
                  window.confirm("Delete this unit assignment?") &&
                  act(securityApi.deleteAssignment, item.id)
                }
              >
                Delete
              </button>
            </p>
          ))}

          {!data.assignments?.length && <small>No unit mappings yet.</small>}
        </div>
      </section>
      <section>
        <h3>
          Staff documents{" "}
          <button onClick={() => setForm("document")}>Upload document</button>
        </h3>
        <div>
          {(data.documents || []).map((item) => (
            <article className="security-document-row" key={item.id}>
              <span className="security-document-icon">
                <FileText size={17} />
              </span>
              <div className="security-document-info">
                <strong>{titleCase(item.documentType)}</strong>
                <small>
                  {item.fileName ||
                    item.documentPath?.split("/").pop() ||
                    "Staff file"}{" "}
                  · {item.staff?.firstName || item.staffId}
                </small>
              </div>
              <span
                className={`security-status-pill ${String(item.verificationStatus || item.status || "pending").toLowerCase()}`}
              >
                {titleCase(item.verificationStatus || item.status || "PENDING")}
              </span>
              <div className="security-document-actions">
                <a
                  href={documentUrl(item.documentPath)}
                  target="_blank"
                  rel="noreferrer"
                  title="Open document"
                >
                  Open
                </a>
                <button
                  onClick={() => act(securityApi.verifyDocument, item.id)}
                >
                  Verify
                </button>
                <button
                  onClick={() =>
                    act(securityApi.rejectDocument, item.id, {
                      remarks: "Rejected from security console",
                    })
                  }
                >
                  Reject
                </button>
                <button
                  onClick={() => setEditRecord({ item, tab: "documents" })}
                >
                  Edit
                </button>
                <button
                  onClick={() =>
                    window.confirm("Delete this document record?") &&
                    act(securityApi.deleteDocument, item.id)
                  }
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
          {!data.documents?.length && (
            <small>No documents have been uploaded.</small>
          )}
        </div>
      </section>
    </div>
  );
}
