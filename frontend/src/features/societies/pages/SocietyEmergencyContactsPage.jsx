import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ambulance,
  Building2,
  Clock3,
  Droplets,
  Edit2,
  Eye,
  Flame,
  Fuel,
  Hospital,
  Mail,
  MapPin,
  Phone,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Siren,
  Trash2,
  Zap,
  X,
} from "lucide-react";
import { legacyApi } from "../../../lib/axios";
import useAuth from "../../../app/providers/useAuth";
import "./society-emergency-contacts.css";

const CATEGORIES = [
  "POLICE",
  "FIRE",
  "AMBULANCE",
  "HOSPITAL",
  "SECURITY",
  "ELECTRICITY",
  "WATER",
  "GAS",
  "DISASTER_RESPONSE",
  "SOCIETY_OFFICE",
  "OTHER",
];
const EMPTY = {
  name: "",
  category: "POLICE",
  phone: "",
  alternatePhone: "",
  email: "",
  address: "",
  operatingHours: "",
  available24x7: false,
  notes: "",
  isActive: true,
};
const errorMessage = (error) =>
  error?.response?.data?.message ||
  "Could not complete the emergency contact request.";
const pretty = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
const CATEGORY_ICONS = {
  POLICE: Shield,
  FIRE: Flame,
  AMBULANCE: Ambulance,
  HOSPITAL: Hospital,
  SECURITY: ShieldCheck,
  ELECTRICITY: Zap,
  WATER: Droplets,
  GAS: Fuel,
  DISASTER_RESPONSE: Siren,
  SOCIETY_OFFICE: Building2,
  OTHER: PhoneCall,
};

export default function SocietyEmergencyContactsPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("SOCIETY_EMERGENCY_CONTACT_CREATE");
  const canUpdate = hasPermission("SOCIETY_EMERGENCY_CONTACT_UPDATE");
  const canDelete = hasPermission("SOCIETY_EMERGENCY_CONTACT_DELETE");
  const [contacts, setContacts] = useState([]);
  const [society, setSociety] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await legacyApi.get("/society-emergency-contacts");
      setContacts(Array.isArray(response.data?.data) ? response.data.data : []);
      setSociety(response.data?.society || null);
    } catch (requestError) {
      setError(errorMessage(requestError));
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!formOpen) return undefined;
    const prior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => {
      if (event.key === "Escape") setFormOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prior;
      window.removeEventListener("keydown", onKey);
    };
  }, [formOpen]);

  const startCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setError("");
    setFormOpen(true);
  };
  const startEdit = (contact) => {
    setEditing(contact);
    setForm({ ...EMPTY, ...contact });
    setError("");
    setFormOpen(true);
  };
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (editing)
        await legacyApi.put(`/society-emergency-contacts/${editing.id}`, form);
      else await legacyApi.post("/society-emergency-contacts", form);
      setFormOpen(false);
      setMessage(
        editing ? "Emergency contact updated." : "Emergency contact added.",
      );
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };
  const remove = async (contact) => {
    if (!window.confirm(`Remove ${contact.name} from the emergency contacts?`))
      return;
    setError("");
    setMessage("");
    try {
      await legacyApi.delete(`/society-emergency-contacts/${contact.id}`);
      setMessage("Emergency contact removed.");
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };
  const updateField = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return contacts.filter(
      (contact) =>
        (categoryFilter === "ALL" || contact.category === categoryFilter) &&
        (!query ||
          [
            contact.name,
            contact.category,
            contact.phone,
            contact.alternatePhone,
            contact.email,
            contact.address,
          ].some((item) =>
            String(item || "")
              .toLowerCase()
              .includes(query),
          )),
    );
  }, [categoryFilter, contacts, search]);
  const activeCount = contacts.filter((contact) => contact.isActive).length;
  const alwaysAvailableCount = contacts.filter(
    (contact) => contact.isActive && contact.available24x7,
  ).length;

  return (
    <section className="society-dashboard emergency-contacts-page">
      <header className="society-heading emergency-contacts-heading">
        <div>
          <div className="society-eyebrow">
            <span className="society-eyebrow-dot" /> MANAGE SOCIETY{" "}
            <span className="emergency-contacts-breadcrumb">
              / EMERGENCY CONTACTS
            </span>
          </div>
          <h1>Emergency contacts</h1>
          <p>
            {society?.name
              ? `Important services for ${society.name}.`
              : "Keep important emergency and utility numbers available to your community."}
          </p>
        </div>
        <div className="emergency-contacts-heading-actions">
          <button
            type="button"
            className="society-refresh-button"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          {canCreate && (
            <button
              type="button"
              className="society-add-button"
              onClick={startCreate}
            >
              <Plus size={17} /> Add contact
            </button>
          )}
        </div>
      </header>
      <section className="emergency-contacts-banner">
        <span className="emergency-contacts-banner-icon">
          <PhoneCall size={21} />
        </span>
        <div>
          <span>QUICK ACCESS DIRECTORY</span>
          <h2>{society?.name || "Your society"}</h2>
          <p>
            Reach local responders, essential services, and your society team
            without searching through old records.
          </p>
        </div>

      </section>
      <section
        className="emergency-contacts-summary"
        aria-label="Emergency contact summary"
      >
        <article>
          <span className="emergency-summary-icon purple">
            <Phone size={17} />
          </span>
          <div>
            <small>Listed contacts</small>
            <strong>{loading ? "—" : contacts.length}</strong>
          </div>
        </article>
        <article>
          <span className="emergency-summary-icon green">
            <Eye size={17} />
          </span>
          <div>
            <small>Active services</small>
            <strong>{loading ? "—" : activeCount}</strong>
          </div>
        </article>
        <article>
          <span className="emergency-summary-icon orange">
            <Clock3 size={17} />
          </span>
          <div>
            <small>Available 24/7</small>
            <strong>{loading ? "—" : alwaysAvailableCount}</strong>
          </div>
        </article>
      </section>
      {error && (
        <div className="society-error" role="alert">
          {error}
          <button type="button" onClick={load}>
            Try again
          </button>
        </div>
      )}
      {message && (
        <div className="society-success" role="status">
          {message}
          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      )}
      <section className="emergency-directory-panel">
        <div className="emergency-directory-head">
          <div>
            <span className="emergency-contact-kicker">
              SOCIETY RESPONSE DIRECTORY
            </span>
            <h2>Emergency services</h2>
            <p>Response teams and essential services for your community.</p>
          </div>
          <span className="emergency-directory-count">
            {loading
              ? "Loading…"
              : `${filteredContacts.length} ${filteredContacts.length === 1 ? "contact" : "contacts"}`}
          </span>
        </div>
        <div className="emergency-directory-toolbar">
          <label className="emergency-directory-search">
            <Search size={17} />
            <input
              aria-label="Search emergency contacts"
              placeholder="Search services, phone numbers, or locations…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div
            className="emergency-category-filters"
            aria-label="Filter by service category"
          >
            <button
              type="button"
              className={categoryFilter === "ALL" ? "active" : ""}
              onClick={() => setCategoryFilter("ALL")}
            >
              All services
            </button>
            {CATEGORIES.map((category) => (
              <button
                type="button"
                key={category}
                className={categoryFilter === category ? "active" : ""}
                onClick={() =>
                  setCategoryFilter(
                    categoryFilter === category ? "ALL" : category,
                  )
                }
              >
                {pretty(category)}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="emergency-directory-state">
            <span className="society-loader" />
            Loading emergency contacts…
          </div>
        ) : filteredContacts.length ? (
          <div className="emergency-contact-grid">
            {filteredContacts.map((contact) => {
              const ContactIcon = CATEGORY_ICONS[contact.category] || PhoneCall;
              return (
              <article
                className={`emergency-contact-card category-${contact.category.toLowerCase()}${contact.isActive ? "" : " is-inactive"}`}
                key={contact.id}
              >
                <div className="emergency-contact-card-top">
                  <span
                    className={`emergency-contact-icon category-${contact.category.toLowerCase()}`}
                  >
                    <ContactIcon size={19} />
                  </span>
                  <span className="emergency-contact-category">
                    {pretty(contact.category)}
                  </span>
                  <span
                    className={`emergency-contact-status${contact.isActive ? " active" : ""}`}
                  >
                    {contact.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <h3>{contact.name}</h3>
                <a
                  href={`tel:${String(contact.phone || "").replace(/[^+\d]/g, "")}`}
                  className="emergency-contact-phone"
                >
                  <Phone size={15} />
                  {contact.phone}
                </a>
                {contact.alternatePhone && (
                  <a
                    href={`tel:${String(contact.alternatePhone).replace(/[^+\d]/g, "")}`}
                    className="emergency-contact-alt"
                  >
                    Alt. {contact.alternatePhone}
                  </a>
                )}
                <div className="emergency-contact-meta">
                  <span>
                    <Clock3 size={14} />
                    {contact.available24x7
                      ? "Available 24/7"
                      : contact.operatingHours || "Hours not listed"}
                  </span>
                  {contact.email && (
                    <a href={`mailto:${contact.email}`}>
                      <Mail size={14} />
                      {contact.email}
                    </a>
                  )}
                  {contact.address && (
                    <span>
                      <MapPin size={14} />
                      {contact.address}
                    </span>
                  )}
                </div>
                {contact.notes && (
                  <p className="emergency-contact-notes">{contact.notes}</p>
                )}
                {(canUpdate || canDelete) && (
                  <div className="emergency-contact-card-actions">
                    {canUpdate && (
                      <button type="button" onClick={() => startEdit(contact)}>
                        <Edit2 size={14} /> Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        className="remove"
                        onClick={() => remove(contact)}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </div>
                )}
              </article>
              );
            })}
          </div>
        ) : (
          <div className="emergency-directory-empty">
            <span className="emergency-directory-empty-icon">
              <PhoneCall size={22} />
            </span>
            <h3>
              {search || categoryFilter !== "ALL"
                ? "No matching contacts"
                : "Build your emergency directory"}
            </h3>
            <p>
              {search || categoryFilter !== "ALL"
                ? "Try a different search or service category."
                : "Add police, fire, ambulance, hospital, utilities, or society office contacts for quick access."}
            </p>
            {canCreate && !search && categoryFilter === "ALL" && (
              <button
                type="button"
                className="society-add-button"
                onClick={startCreate}
              >
                <Plus size={16} /> Add first contact
              </button>
            )}
          </div>
        )}
      </section>
      {formOpen && (
        <div
          className="society-modal-layer"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setFormOpen(false);
          }}
        >
          <section
            className="emergency-contact-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="emergency-contact-title"
          >
            <header>
              <div>
                <span className="notices-eyebrow">
                  <AlertTriangle size={14} /> SOCIETY DIRECTORY
                </span>
                <h2 id="emergency-contact-title">
                  {editing ? "Edit emergency contact" : "Add emergency contact"}
                </h2>
                <p>Enter a reliable contact for residents and staff.</p>
              </div>
              <button
                type="button"
                className="notice-close-button"
                onClick={() => setFormOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </header>
            <form className="emergency-contact-form" onSubmit={submit}>
              <label>
                Name
                <input
                  required
                  maxLength={140}
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                />
              </label>
              <label>
                Category
                <select
                  value={form.category}
                  onChange={(event) =>
                    updateField("category", event.target.value)
                  }
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {pretty(category)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Phone
                <input
                  required
                  type="tel"
                  maxLength={30}
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                />
              </label>
              <label>
                Alternate phone (optional)
                <input
                  type="tel"
                  maxLength={30}
                  value={form.alternatePhone || ""}
                  onChange={(event) =>
                    updateField("alternatePhone", event.target.value)
                  }
                />
              </label>
              <label>
                Email (optional)
                <span className="emergency-input-icon">
                  <Mail size={15} />
                  <input
                    type="email"
                    maxLength={255}
                    value={form.email || ""}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                  />
                </span>
              </label>
              <label>
                Operating hours (optional)
                <input
                  maxLength={120}
                  value={form.operatingHours || ""}
                  onChange={(event) =>
                    updateField("operatingHours", event.target.value)
                  }
                  placeholder="e.g. 9:00 AM – 6:00 PM"
                />
              </label>
              <label className="emergency-field-wide">
                Address (optional)
                <input
                  maxLength={500}
                  value={form.address || ""}
                  onChange={(event) =>
                    updateField("address", event.target.value)
                  }
                />
              </label>
              <label className="emergency-field-wide">
                Notes (optional)
                <textarea
                  rows={3}
                  value={form.notes || ""}
                  onChange={(event) => updateField("notes", event.target.value)}
                />
              </label>
              <div className="emergency-checks">
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(form.available24x7)}
                    onChange={(event) =>
                      updateField("available24x7", event.target.checked)
                    }
                  />{" "}
                  Available 24/7
                </label>
                {editing && (
                  <label>
                    <input
                      type="checkbox"
                      checked={Boolean(form.isActive)}
                      onChange={(event) =>
                        updateField("isActive", event.target.checked)
                      }
                    />{" "}
                    Active contact
                  </label>
                )}
              </div>
              {error && (
                <div className="notice-form-error emergency-field-wide">
                  {error}
                </div>
              )}
              <footer className="emergency-field-wide">
                <button
                  type="button"
                  className="notice-cancel-button"
                  onClick={() => setFormOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="society-add-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving…"
                    : editing
                      ? "Save changes"
                      : "Add contact"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
