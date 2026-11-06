import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import useAuth from "../../../app/providers/useAuth";
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
import SecurityBadge from "../components/SecurityBadge";
import unitApi from "../../units/api/unit.api";
import { recordToSections, RecordDetailsModal } from "../../../components/ui/Modal";
import GateVisitorAccessPage from "./SecurityPage";

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
const formatBreakTime = (value) => {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes <= 0) return "No break";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const parts = [];
  if (hours) parts.push(`${hours} hr${hours === 1 ? "" : "s"}`);
  if (remainingMinutes) parts.push(`${remainingMinutes} min`);
  return `${parts.join(" ")} break`;
};
const isSecurityScheduleStaff = (person) => {
  const normalize = (value) => String(value || "").replace(/[^a-z0-9]/gi, "").toUpperCase();
  if (normalize(person?.staffType) === "SECURITYGUARD") return true;
  const roles = [
    person?.role,
    person?.roleCode,
    person?.roleName,
    ...(Array.isArray(person?.roles) ? person.roles : []),
    person?.user?.role,
    person?.user?.roleCode,
    person?.user?.roleName,
    ...(Array.isArray(person?.user?.roles) ? person.user.roles : []),
  ];
  return roles.some((role) =>
    normalize(typeof role === "object" ? role?.code || role?.name || role?.roleCode || role?.roleName : role) === "SECURITYHEAD",
  );
};
const toTimeInput = (value) => {
  if (!value) return "";
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return String(value);
  const hour = Number(match[1]);
  return `${String(hour % 12 || 12).padStart(2, "0")}:${match[2]} ${hour >= 12 ? "PM" : "AM"}`;
};
const toApiTime = (value) => {
  const match = /^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i.exec(String(value).trim());
  if (!match) return null;
  const hour = Number(match[1]);
  if (hour < 1 || hour > 12) return null;
  const hour24 = (hour % 12) + (match[3].toUpperCase() === "PM" ? 12 : 0);
  return `${String(hour24).padStart(2, "0")}:${match[2]}`;
};
const timeParts = (value) => {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(value || ""));
  return match
    ? { hour: String(Number(match[1])).padStart(2, "0"), minute: match[2], period: match[3].toUpperCase() }
    : { hour: "", minute: "", period: "" };
};
function TimeSelect({ name, value, defaultValue = "", onChange }) {
  const [selectedParts, setSelectedParts] = useState(() => timeParts(value ?? defaultValue));
  useEffect(() => {
    if (value) setSelectedParts(timeParts(value));
  }, [value]);
  const parts = selectedParts;
  const selectedValue = parts.hour && parts.minute && parts.period
    ? `${parts.hour}:${parts.minute} ${parts.period}`
    : "";
  const update = (key, nextValue) => {
    const next = { ...parts, [key]: nextValue };
    const formatted = next.hour && next.minute && next.period
      ? `${next.hour}:${next.minute} ${next.period}`
      : "";
    setSelectedParts(next);
    if (formatted) onChange?.(formatted);
  };

  return (
    <div className="security-time-select">
      <input type="hidden" name={name} value={selectedValue} />
      <select aria-label={`${name} hour`} required value={parts.hour} onChange={(event) => update("hour", event.target.value)}>
        <option value="">Hour</option>
        {Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0")).map((hour) => <option key={hour} value={hour}>{hour}</option>)}
      </select>
      <select aria-label={`${name} minute`} required value={parts.minute} onChange={(event) => update("minute", event.target.value)}>
        <option value="">Minute</option>
        {Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, "0")).map((minute) => <option key={minute} value={minute}>{minute}</option>)}
      </select>
      <select aria-label={`${name} AM or PM`} required value={parts.period} onChange={(event) => update("period", event.target.value)}>
        <option value="">AM/PM</option>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
const documentUrl = (filePath) => {
  if (!filePath) return "#";
  if (/^https?:\/\//i.test(filePath)) return filePath;
  const apiBase = import.meta.env.VITE_LEGACY_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
  return new URL(filePath.startsWith("/") ? filePath : `/${filePath}`, new URL(apiBase, window.location.origin).origin).toString();
};
const localDate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};
const tabs = [
  ["overview", "Overview", Shield],
  ["staff", "Staff", Users],
  ["attendance", "Attendance", ClipboardCheck],
  ["rosters", "Shifts & schedules", CalendarDays],
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
      ["profilePicture", "Profile picture", "file"],
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
          "MAID",
          "MAINTENANCE",
          "ELECTRICIAN",
          "PLUMBER",
          "GARDENER",
          "OTHER",
        ],
      ],
    ],
  },
  shift: {
    title: "Shift",
    api: "createShift",
    fields: [
      ["shiftCode", "Shift code"],
      ["shiftName", "Shift name"],
      ["startTime", "Start time (AM/PM)", "ampm"],
      ["endTime", "End time (AM/PM)", "ampm"],
      [
        "shiftType",
        "Shift type",
        "select",
        ["MORNING", "AFTERNOON", "EVENING", "NIGHT", "GENERAL", "OTHER"],
      ],
      ["breakMinutes", "Break minutes", "number"],
      ["graceMinutes", "Grace minutes", "number"],
    ],
  },
  roster: {
    title: "Staff schedule",
    api: "createRoster",
    fields: [
      ["staffId", "Staff", "staff"],
      ["shiftId", "Shift", "shift"],
      ["rosterDate", "Schedule date", "date"],
      ["rosterType", "Schedule type", "select", ["DAILY", "WEEKLY", "MONTHLY"]],
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
          "MAID",
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
  patrol: {
    title: "Patrol",
    api: "createPatrol",
    fields: [
      ["staffId", "Staff", "staff"],
      ["gateId", "Assigned gate", "gate"],
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
  if (String(value).toUpperCase() === "MAID") return "MAID";

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
  const { user } = useAuth();
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
        "attendance",
        "shifts",
        "rosters",
        "tasks",
        "gates",
        "patrols",
        "incidents",
        "emergencies",
        "audits",
      ];
      const methods = [
        securityApi.getStaff,
        securityApi.getAttendance,
        securityApi.getShifts,
        securityApi.getRosters,
        securityApi.getTasks,
        securityApi.getGates,
        securityApi.getPatrols,
        securityApi.getIncidents,
        securityApi.getEmergencies,
        securityApi.getAudits,
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
          if (key !== "gates") failed.push(key);
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
  const stats = [
    [
      "Active staff",
      staff.filter((item) => item.status === "ACTIVE").length,
      Users,
      "staff",
      "violet",
    ],
    [
      "On duty today",
      (data.attendance || []).filter(
        (item) => item.status === "PRESENT" || item.status === "LATE",
      ).length,
      ClipboardCheck,
      "attendance",
      "green",
    ],
    [
      "Open incidents",
      (data.incidents || []).filter(
        (item) => !["CLOSED", "RESOLVED", "REJECTED"].includes(item.status),
      ).length,
      AlertOctagon,
      "incidents",
      "blue",
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
      "emergencies",
      "orange",
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
    const profilePicture = formData.get("profilePicture");
    const payload = form === "staff" && profilePicture?.size
      ? formData
      : Object.fromEntries(formData.entries());
    if (form === "shift") {
      const startTime = toApiTime(payload.startTime);
      const endTime = toApiTime(payload.endTime);
      if (!startTime || !endTime) {
        setFormError("Enter both shift times in 12-hour format, such as 06:00 AM or 06:00 PM.");
        return;
      }
      payload.startTime = startTime;
      payload.endTime = endTime;
    }
    if (form === "staff" && profilePicture?.size > 5 * 1024 * 1024) {
      setFormError("The profile picture must be 5 MB or smaller.");
      return;
    }
    if (form === "staff" && !profilePicture?.size) formData.delete("profilePicture");
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
        "patrol",
        "incident",
        "emergency",
      ].includes(form)
    )
      if (payload instanceof FormData) payload.set("societyId", societyId());
      else payload.societyId = societyId();
    if (form === "roster") {
      const assignedBy = user?.id || user?.userId || user?.user?.id || user?.data?.id;
      if (assignedBy) {
        if (payload instanceof FormData) payload.set("assignedBy", assignedBy);
        else payload.assignedBy = assignedBy;
      }
    }
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
          onClick={() => setWorkflow({ type: tab, item })}
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
    staff: ["Employee", "Employee code", "Type", "Contact", "Joined", "Status"],
    attendance: ["Staff", "Date", "Check in", "Check out", "Status"],
    rosters: ["Staff", "Shift", "Schedule date", "Schedule type", "Status"],
    tasks: ["Title", "Staff", "Type", "Due", "Priority", "Status"],
    patrols: ["Patrol", "Staff", "Gate", "Date", "Window", "Status"],
    incidents: ["Number", "Incident", "Severity", "Location", "Status"],
    emergencies: ["Number", "Emergency", "Priority", "Location", "Status"],
    audit: ["When", "Module", "Action", "Actor", "Severity"],
  };
  const cells = (item) =>
    ({
      staff: [
        `${item.firstName || ""} ${item.lastName || ""}`.trim(),
        item.employeeCode || "—",
        titleCase(item.staffType),
        item.mobileNumber,
        item.joiningDate?.slice(0, 10),
        <SecurityBadge value={item.status} />,
      ],
      attendance: [
        staffName(item.staffId),
        item.attendanceDate?.slice(0, 10),
        formatTime(item.checkInTime),
        formatTime(item.checkOutTime),
        <SecurityBadge value={item.status} />,
      ],
      rosters: [
        staffName(item.staffId),
        shiftName(item.shiftId),
        item.rosterDate?.slice(0, 10),
        titleCase(item.rosterType),
        <SecurityBadge value={item.status} />,
      ],
      tasks: [
        item.title,
        staffName(item.staffId),
        titleCase(item.taskType),
        item.dueDate?.slice(0, 10),
        titleCase(item.priority),
        <SecurityBadge value={item.status} />,
      ],
      patrols: [
        item.patrolName,
        staffName(item.staffId),
        (data.gates || []).find((gate) => String(gate.id) === String(item.gateId))?.name || "—",
        item.patrolDate?.slice(0, 10),
        `${item.plannedStartTime || "—"} – ${item.plannedEndTime || "—"}`,
        <SecurityBadge value={item.status} />,
      ],
      incidents: [
        item.incidentNumber,
        <>
          <strong>{item.title}</strong>
        </>,
        titleCase(item.severity),
        display(item.location),
        <SecurityBadge value={item.status} />,
      ],
      emergencies: [
        item.emergencyNumber,
        <>
          <strong>{item.title}</strong>
        </>,
        titleCase(item.priority),
        display(item.location),
        <SecurityBadge value={item.status} />,
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
    <section className="society-dashboard security-page module-shell-page">
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
            {stats.map(([label, count, Icon, targetTab, color]) => (
              <button type="button" className={`society-stat-card security-summary-card security-summary-${color}`} key={label} onClick={() => setTab(targetTab)}>
                <span className={`society-stat-icon society-stat-icon-${color}`}>
                  <Icon size={19} />
                </span>
                <div>
                  <span className="society-stat-label">{label}</span>
                  <small className="society-stat-note security-summary-note">Open {targetTab} →</small>
                  <strong>{loading ? "—" : count}</strong>
                </div>
              </button>
            ))}
          </div>
          <div className="society-lifecycle-grid">
            {[
              ["Patrols", "patrols", "patrols", MapPin, "teal"],
              ["Incidents", "incidents", "incidents", AlertOctagon, "rose"],
              ["Emergency calls", "emergencies", "emergencies", Siren, "cyan"],
              ["Staff tasks", "tasks", "tasks", ClipboardCheck, "slate"],
            ].map(([label, key, route, Icon, color]) => (
              <button
                className={`society-stat-card assets-quick-card security-quick-card security-quick-card-${color}`}
                key={key}
                onClick={() => setTab(route)}
              >
                <span className="society-stat-icon security-quick-icon"><Icon size={19} /></span>
                <div>
                  <span className="society-stat-label security-quick-label">{label}</span>
                  <small className="society-stat-note security-summary-note">Open {route} →</small>
                  <strong>{(data[key] || []).length}</strong>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : tab === "gates" ? (
        <GateVisitorAccessPage embedded />
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
                className="society-add-button security-shift-toolbar-action"
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
                className={`society-add-button ${tab === "rosters" ? "security-shift-toolbar-action" : ""}`}
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
                    ? "staff schedule"
                    : tab.slice(0, -1)}
              </button>
            )}
          </div>
          {tab === "rosters" && (
            <section className="security-shifts">
              <h3>Shift definitions</h3>
              {(data.shifts || []).map((shift) => (
                <article key={shift.id}>
                  <strong>{shift.shiftName}</strong>
                  <span>
                    {formatTime(shift.startTime)}–{formatTime(shift.endTime)} ·{" "}
                    {formatBreakTime(shift.breakMinutes)} · {titleCase(shift.shiftType)}
                  </span>
                  <span className={`security-shift-status ${shift.status === "ACTIVE" ? "is-active" : "is-inactive"}`}>
                    {shift.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"}
                  </span>
                  <button
                    className={`security-shift-action ${shift.status === "ACTIVE" ? "is-deactivate" : "is-activate"}`}
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
                    className="security-shift-action is-edit"
                    onClick={() =>
                      setEditRecord({ item: shift, tab: "shifts" })
                    }
                  >
                    Edit
                  </button>
                  <button
                    className="security-shift-action is-delete society-delete-action"
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
                        <td key={index}>{tab === "staff" && index === 0 ? <div className="staff-record-cell"><span className="staff-record-avatar">{item.photoPath && <img className="staff-record-photo" src={documentUrl(item.photoPath)} alt="" onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.nextElementSibling.hidden = false; }} />}<Users className="staff-record-fallback" size={18} hidden={Boolean(item.photoPath)} /></span><button type="button" className="record-details-trigger staff-record-name" onClick={() => setViewingStaff(item)}>{value}</button></div> : value}</td>
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
                <p>{form === "staff" ? "Security Guard staff are added to User Management with an active Security Head account. You can suspend or reactivate this account from its user profile." : form === "shift" ? "Choose the hour, minute, and AM/PM for each shift time." : "Enter the record details below."}</p>
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
                          {(form === "roster" ? staff.filter(isSecurityScheduleStaff) : staff).map((person) => (
                            <option key={person.id} value={person.id}>
                              {person.firstName} {person.lastName} ·{" "}
                              {person.employeeCode}
                            </option>
                          ))}
                        </select>
                      ) : type === "gate" ? (
                        <select name={name} required>
                          <option value="">Select gate</option>
                          {(data.gates || []).filter((gate) => gate.status === "ACTIVE").map((gate) => (
                            <option key={gate.id} value={gate.id}>
                              {gate.name}{gate.location ? ` · ${gate.location}` : ""}
                            </option>
                          ))}
                        </select>
                      ) : type === "shift" ? (
                        <select name={name} required>
                          <option value="">Select shift</option>
                          {(data.shifts || []).map((shift) => (
                            <option key={shift.id} value={shift.id}>
                              {shift.shiftName} · {formatTime(shift.startTime)}–
                              {formatTime(shift.endTime)} · {formatBreakTime(shift.breakMinutes)}
                            </option>
                          ))}
                        </select>
                      ) : type === "file" ? (
                        <><input name={name} type="file" accept="image/jpeg,image/png,image/webp" /><small>JPG, PNG, or WEBP · Up to 5 MB</small></>
                      ) : type === "ampm" ? (
                        <TimeSelect name={name} />
                      ) : type === "textarea" ? (
                        <textarea
                          name={name}
                          rows="3"
                          required={name === "description"}
                        />
                      ) : (
                        <input
                          name={name}
                          type={name === "email" && form === "staff" ? "email" : type}
                          required={
                            ![
                              "lastName",
                              "profilePicture",
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
            {formError && <p className="security-form-error" role="alert">{formError}</p>}
          </section>
        </div>
      )}
      {editRecord && (
        <RecordEditModal
          record={editRecord.item}
          tab={editRecord.tab}
          staff={staff}
          shifts={data.shifts || []}
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
      {viewingStaff && <RecordDetailsModal title={`${viewingStaff.firstName || ""} ${viewingStaff.lastName || ""}`.trim() || "Staff profile"} subtitle="Staff member profile and employment information" icon={Users} image={viewingStaff.photoPath ? documentUrl(viewingStaff.photoPath) : undefined} record={viewingStaff} sections={recordToSections(Object.fromEntries(Object.entries(viewingStaff).filter(([key]) => key !== "photoPath")))} onClose={() => setViewingStaff(null)}>{viewingStaff.staffType === "MAID" && <MaidUnitMapping staffId={viewingStaff.id} active={viewingStaff.status === "ACTIVE"} />}</RecordDetailsModal>}
      {workflow && (
        <SecurityWorkflowDialog
          workflow={workflow}
          staff={staff}
          busy={busy}
          onClose={() => setWorkflow(null)}
          onSubmit={async (action, payload) => {
            const { type, item } = workflow;
            if (type === "patrols") {
              await act(securityApi.patrolAction, item.id, action);
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

function RecordEditModal({ record, tab, staff = [], shifts = [], onClose, onSave }) {
  const fieldToken = (key) => String(key).replace(/[^a-z0-9]/gi, "").toLowerCase();
  const rosterCanonicalKey = (key) => ({
    staffid: "staffId",
    shiftid: "shiftId",
    rosterdate: "rosterDate",
    rostertype: "rosterType",
    remarks: "remarks",
  })[fieldToken(key)] || key;
  const normalizeDate = (value) => {
    if (!value || value === "Invalid date") return "";
    const date = String(value).match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    return date && !Number.isNaN(Date.parse(`${date}T00:00:00`)) ? date : "";
  };
  const editable = Object.fromEntries(
    Object.entries(record).filter(
      ([key, value]) =>
        !["id", "createdAt", "updatedAt", "deletedAt", ...(tab === "staff" ? ["photoPath"] : [])].includes(key) &&
        !(tab === "rosters" && ["societyid", "assignedby", "status"].includes(fieldToken(key))) &&
        (value == null ||
          ["string", "number", "boolean"].includes(typeof value)),
    ),
  );
  const [values, setValues] = useState(() => Object.fromEntries(
    Object.entries(editable).map(([key, value]) => [
      key,
      (["dateOfBirth", "joiningDate"].includes(key) || (tab === "rosters" && fieldToken(key) === "rosterdate"))
        ? normalizeDate(value)
        : tab === "shifts" && ["startTime", "endTime"].includes(key)
          ? toTimeInput(value)
          : value,
    ]),
  ));
  const [profilePicture, setProfilePicture] = useState(null);
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        value === "" ? null : value,
      ]),
    );
    if (tab === "rosters") {
      const normalizedPayload = {};
      Object.entries(payload).forEach(([key, value]) => {
        const token = fieldToken(key);
        if (["societyid", "assignedby", "status"].includes(token)) return;
        normalizedPayload[rosterCanonicalKey(key)] = value;
      });
      Object.keys(payload).forEach((key) => delete payload[key]);
      Object.assign(payload, normalizedPayload);
    }
    if (tab === "shifts") {
      const startTime = toApiTime(payload.startTime);
      const endTime = toApiTime(payload.endTime);
      if (!startTime || !endTime) {
        setError("Enter both shift times in 12-hour format, such as 06:00 AM or 06:00 PM.");
        return;
      }
      payload.startTime = startTime;
      payload.endTime = endTime;
    }
    if (tab === "staff" && !payload.joiningDate) {
      setError("Enter a valid joining date before saving staff details.");
      return;
    }
    if (tab === "staff" && profilePicture?.size > 5 * 1024 * 1024) {
      setError("The profile picture must be 5 MB or smaller.");
      return;
    }
    const requestPayload = tab === "staff" && profilePicture
      ? Object.entries(payload).reduce((formData, [key, value]) => {
          formData.append(key, value == null ? "" : String(value));
          return formData;
        }, new FormData())
      : payload;
    if (requestPayload instanceof FormData) requestPayload.append("profilePicture", profilePicture);
    try {
      await onSave(record.id, tab, requestPayload);
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
            <h2>{tab === "rosters" ? "Edit Staff schedule" : `Edit ${titleCase(tab)} record`}</h2>
            <p>Update record details and save your changes.</p>
          </div>
          <button aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <form onSubmit={submit}>
          <div className="security-form-grid">
            {tab === "staff" && <label className="security-profile-picture-edit">Profile picture{record.photoPath && <img src={documentUrl(record.photoPath)} alt="Current staff profile" />}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setProfilePicture(event.target.files?.[0] || null)} /><small>Choose a JPG, PNG, or WEBP image up to 5 MB. Leave empty to keep the current picture.</small></label>}
            {Object.entries(values).map(([key, value]) => (
              <label key={key}>
                {tab === "shifts" && ["startTime", "endTime"].includes(key)
                  ? `${titleCase(key)} (AM/PM)`
                  : titleCase(key)}
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
                ) : (tab === "assignments" && key === "staffId") ||
                  (tab === "rosters" && fieldToken(key) === "staffid") ? (
                  <select
                    required={tab === "rosters"}
                    value={value ?? ""}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                  >
                    {tab === "rosters" && <option value="">Select staff member</option>}
                    {(tab === "rosters" ? staff.filter(isSecurityScheduleStaff) : staff).map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.firstName} {person.lastName} ·{" "}
                        {person.employeeCode}
                      </option>
                    ))}
                  </select>
                ) : tab === "rosters" && fieldToken(key) === "shiftid" ? (
                  <select
                    required
                    value={value ?? ""}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, [key]: event.target.value }))
                    }
                  >
                    <option value="">Select shift</option>
                    {shifts.map((shift) => (
                      <option key={shift.id} value={shift.id}>
                        {shift.shiftName || "Shift"} · {formatTime(shift.startTime)}–{formatTime(shift.endTime)} · {formatBreakTime(shift.breakMinutes)}
                      </option>
                    ))}
                  </select>
                ) : tab === "shifts" && key === "status" ? (
                  <select
                    value={value ?? "ACTIVE"}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                ) : tab === "shifts" && ["startTime", "endTime"].includes(key) ? (
                  <TimeSelect
                    name={key}
                    value={value ?? ""}
                    onChange={(nextValue) =>
                      setValues((current) => ({ ...current, [key]: nextValue }))
                    }
                  />
                ) : (
                  <input
                    type={["dateOfBirth", "joiningDate"].includes(key) || (tab === "rosters" && fieldToken(key) === "rosterdate") ? "date" : "text"}
                    required={tab === "staff" && key === "joiningDate"}
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
  busy,
  onClose,
  onSubmit,
}) {
  const { type, item } = workflow;
  const [action, setAction] = useState(
    type === "patrols"
      ? "start"
      : type === "tasks"
        ? "start"
        : type === "rosters"
          ? "confirm"
          : "acknowledge",
  );
  const [error, setError] = useState("");
  const actionOptions =
    type === "patrols"
      ? [
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
              ["confirm", "Confirm schedule"],
              ["complete", "Complete schedule"],
              ["cancel", "Cancel schedule"],
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
    if (["cancel", "false-alarm"].includes(action))
      payload = { remarks: values.notes };
    if (action === "external-contacts")
      payload = {
        policeContacted: values.police === "on",
        ambulanceContacted: values.ambulance === "on",
        fireBrigadeContacted: values.fire === "on",
      };
    try {
      await onSubmit(action, payload);
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not complete this action.",
      );
    }
  };
  const needsNotes = [
    "investigate",
    "resolve",
    "respond",
    "cancel",
    "false-alarm",
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
                      : "Reason / remarks"}
                <textarea
                  name="notes"
                  rows="3"
                  required
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

function MaidUnitMapping({ staffId, active }) {
  const [units, setUnits] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [unitId, setUnitId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadMappings = async () => {
    const [unitResponse, assignmentResponse] = await Promise.all([
      unitApi.getAll(),
      securityApi.getStaffAssignments(staffId),
    ]);
    setUnits(rowsFrom(unitResponse));
    setAssignments(rowsFrom(assignmentResponse));
  };

  useEffect(() => {
    loadMappings().catch((err) =>
      setError(err.response?.data?.message || "Could not load maid unit mappings."),
    );
  }, [staffId]);

  const addMapping = async (event) => {
    event.preventDefault();
    if (!active || !unitId) return;
    setBusy(true);
    setError("");
    try {
      await securityApi.createStaffAssignment({
        staffId,
        unitId,
        assignmentType: "HOUSEKEEPING",
        startDate: localDate(),
      });
      setUnitId("");
      await loadMappings();
    } catch (err) {
      setError(err.response?.data?.message || "Could not map this unit to the maid.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="record-details-section maid-unit-mapping">
      <h3>Unit mapping</h3>
      <form onSubmit={addMapping} className="maid-unit-mapping-form">
        <select value={unitId} onChange={(event) => setUnitId(event.target.value)} disabled={!active || busy}>
          <option value="">Select a unit</option>
          {units.filter((unit) => !assignments.some((assignment) => String(assignment.unitId) === String(unit.id) && assignment.status === "ACTIVE")).map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.unitNumber || unit.name || unit.id}
            </option>
          ))}
        </select>
        <button type="submit" className="society-add-button" disabled={!active || busy || !unitId}>
          {busy ? "Adding…" : "Add unit"}
        </button>
      </form>
      {!active && <p className="maid-unit-mapping-note">Activate this staff record before assigning units.</p>}
      {error && <p className="security-form-error" role="alert">{error}</p>}
      <div className="maid-unit-mapping-list">
        {assignments.map((assignment) => {
          const unit = units.find((item) => String(item.id) === String(assignment.unitId));
          return (
            <div className="maid-unit-mapping-row" key={assignment.id}>
              <strong>{unit?.unitNumber || unit?.name || "Unit"}</strong>
              <span>{titleCase(assignment.status || "ACTIVE")}</span>
              <small>Since {assignment.startDate || "—"}</small>
            </div>
          );
        })}
        {!assignments.length && <small>No units mapped yet.</small>}
      </div>
    </section>
  );
}

