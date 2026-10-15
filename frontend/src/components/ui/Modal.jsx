import { useEffect, useRef } from 'react';

/**
 * Form dialog on the native <dialog>. Mount it only while it should be open
 * ({open && <Modal ...>}) so the form inside starts fresh every time.
 */
export default function Modal({ title, onClose, busy = false, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      className="dialog dialog-form"
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
