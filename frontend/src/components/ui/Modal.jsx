import { useEffect, useRef } from 'react';
import { Building2 } from 'lucide-react';

/**
 * Form dialog on the native <dialog>. Mount it only while it should be open
 * ({open && <Modal ...>}) so the form inside starts fresh every time.
 */
export default function Modal({ title, onClose, busy = false, children, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      className={`dialog dialog-form ${className}`.trim()}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="dialog-head">
        <h2>{title}</h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={busy} aria-label="Close">
          &times;
        </button>
      </div>
      {children}
    </dialog>
  );
}

const labelFor = (key) => key
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase())
  .replace(/\bId\b/g, 'ID');

export const recordToSections = (record) => {
  const fields = Object.entries(record || {})
    .filter(([key, value]) => !/(^id$|_id$|password|token|secret|credential)/i.test(key)
      && value !== null && value !== undefined && value !== ''
      && (['string', 'number', 'boolean'].includes(typeof value) || Array.isArray(value)))
    .map(([key, value]) => [labelFor(key), value]);
  return fields.length ? [{ title: 'Record information', fields }] : [];
};

export const displayRecordName = (record, keys = ['name', 'displayName', 'title', 'unitNumber', 'firstName']) => {
  for (const key of keys) {
    const value = record?.[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return 'Record details';
};

const displayValue = (value) => {
  if (value === null || value === undefined || value === '') return 'Not provided';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'Not provided';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export function RecordDetailsModal({ title, subtitle, icon: Icon = Building2, image, sections, record, onClose }) {
  const detailSections = sections || recordToSections(record);
  return (
    <Modal title={title} onClose={onClose} className="record-details-dialog">
      {subtitle && (
        <div className="record-details-intro">
          {image ? <img className="record-details-icon record-details-photo" src={image} alt="Resident profile" /> : <span className="record-details-icon"><Icon size={21} /></span>}
          <p>{subtitle}</p>
        </div>
      )}
      <div className="record-details-sections">
        {detailSections.filter((section) => section.fields.length > 0).map((section) => (
          <section className="record-details-section" key={section.title}>
            <h3>{section.title}</h3>
            <dl>
              {section.fields.map(([label, value]) => (
                <div key={label}><dt>{label}</dt><dd>{displayValue(value)}</dd></div>
              ))}
            </dl>
          </section>
        ))}
      </div>
      <div className="record-details-footer">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
