import { useEffect, useState } from 'react';
import ConfirmDialog from './ConfirmDialog';
import { CONFIRM_EVENT } from '../../lib/dashboardConfirmation';

export default function DashboardConfirmation() {
  const [request, setRequest] = useState(null);

  useEffect(() => {
    const onConfirm = (event) => {
      const next = event.detail;
      setRequest((current) => {
        if (current) current.resolve(false);
        return next;
      });
    };
    window.addEventListener(CONFIRM_EVENT, onConfirm);
    return () => {
      window.removeEventListener(CONFIRM_EVENT, onConfirm);
      setRequest((current) => {
        current?.resolve(false);
        return null;
      });
    };
  }, []);

  const finish = (confirmed) => {
    request?.resolve(confirmed);
    setRequest(null);
  };

  return request ? (
    <ConfirmDialog
      open
      title={request.title}
      message={request.message}
      confirmLabel={request.confirmLabel}
      danger={request.danger}
      onConfirm={() => finish(true)}
      onCancel={() => finish(false)}
    />
  ) : null;
}
