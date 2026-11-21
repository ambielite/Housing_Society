import { hasRecentActionToast } from '../../lib/actionToastEvents';

export default function Alert({ variant = 'error', children }) {
  // Authenticated create/update/delete requests already show these results in
  // the global popup. Keep non-action and validation errors inline, but hide
  // the duplicate banner shown immediately after a failed write.
  if (variant === 'success') return null;
  if (variant === 'error' && hasRecentActionToast('error')) return null;

  return (
    <div className={`alert alert-${variant}`} role={variant === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
