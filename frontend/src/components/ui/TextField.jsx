import { useState } from 'react';

export default function TextField({ label, id, type = 'text', error, hint, ...inputProps }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          className={`input${error ? ' input-error' : ''}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            className="input-toggle input-toggle--icon"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            <svg viewBox="0 0 32 24" fill="none" aria-hidden="true">
              {visible ? (
                <>
                  <path d="M3 12s4.7-8 13-8 13 8 13 8-4.7 8-13 8S3 12 3 12Z" />
                  <circle cx="16" cy="12" r="4" />
                  <path d="m5 22 22-20" />
                </>
              ) : (
                <>
                  <path d="M3 12s4.7-8 13-8 13 8 13 8-4.7 8-13 8S3 12 3 12Z" />
                  <circle cx="16" cy="12" r="4" />
                </>
              )}
            </svg>
          </button>
        )}
      </div>
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
