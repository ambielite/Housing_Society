import { useEffect, useRef } from 'react';

/** Modal confirmation built on the native <dialog> (focus trap + Esc key included). */
export default function ConfirmDialog({ open, title, message, confirmLabel, danger = false, busy = false, onConfirm, onCancel }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2>{title}</h2>
      <p className="dialog-message">{message}</p>
      <div className="dialog-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button
          type="button"
          className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? 'Working...' : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
