import { useEffect } from 'react';
import { dispatchActionToast } from '../../lib/actionToastEvents';

export default function Alert({ variant = 'error', children }) {
  useEffect(() => {
    if (variant !== 'error' && variant !== 'success') return;
    const message = typeof children === 'string' || typeof children === 'number'
      ? String(children)
      : '';
    if (message) dispatchActionToast(variant, message);
  }, [children, variant]);

  if (variant === 'error' || variant === 'success') return null;
  return <div className={`alert alert-${variant}`} role="status">{children}</div>;
}
