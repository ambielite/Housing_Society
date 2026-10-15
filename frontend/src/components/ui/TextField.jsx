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
            className="input-toggle"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? 'Hide' : 'Show'}
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
