import { useEffect, useRef, useState } from 'react';
import { Check, CircleAlert, X } from 'lucide-react';
import './ActionToast.css';

const AUTO_DISMISS_MS = 4200;

export default function ActionToast() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const recentToasts = useRef(new Map());

  useEffect(() => {
    const dismiss = (id) => {
      const timer = timers.current.get(id);
      if (timer) clearTimeout(timer);
      timers.current.delete(id);
      setToasts((current) => current.filter((toast) => toast.id !== id));
    };

    const onToast = (event) => {
      const type = event.detail?.type === 'error' ? 'error' : 'success';
      const source = event.detail?.source === 'api' ? 'api' : 'ui';
      const now = Date.now();
      const recent = recentToasts.current.get(type);
      const isSameActionBurst = recent && (
        now - recent.at < 1200
        || (recent.source === 'api' && source !== 'api' && now - recent.at < 8000)
      );
      if (isSameActionBurst) {
        const timer = timers.current.get(recent.id);
        if (timer) clearTimeout(timer);
        timers.current.delete(recent.id);
        setToasts((current) => current.filter((toast) => toast.id !== recent.id));
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const toast = {
        id,
        type,
        source,
        message: String(event.detail?.message || ''),
      };
      if (!toast.message) return;
      recentToasts.current.set(type, { id, source, at: now });
      setToasts((current) => [...current, toast].slice(-3));
      timers.current.set(id, setTimeout(() => dismiss(id), AUTO_DISMISS_MS));
    };

    window.addEventListener('dashboard:action-toast', onToast);
    return () => {
      window.removeEventListener('dashboard:action-toast', onToast);
      timers.current.forEach(clearTimeout);
      timers.current.clear();
      recentToasts.current.clear();
    };
  }, []);

  return (
    <div className="action-toast-stack" aria-label="Action messages">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const Icon = isError ? CircleAlert : Check;
        return (
          <div
            key={toast.id}
            className={`action-toast action-toast-${toast.type}`}
            role={isError ? 'alert' : 'status'}
            aria-live={isError ? 'assertive' : 'polite'}
          >
            <span className="action-toast-icon"><Icon size={18} strokeWidth={2.5} /></span>
            <span className="action-toast-copy">
              <strong>{isError ? 'Action failed' : 'Success'}</strong>
              <span>{toast.message}</span>
            </span>
            <button type="button" onClick={() => {
              const timer = timers.current.get(toast.id);
              if (timer) clearTimeout(timer);
              timers.current.delete(toast.id);
              setToasts((current) => current.filter((item) => item.id !== toast.id));
            }} aria-label="Dismiss message">
              <X size={16} />
            </button>
            <span className="action-toast-progress" />
          </div>
        );
      })}
    </div>
  );
}
