import { humanize } from '../../../utils/format';
import { PO_STATUS_LABELS } from './purchaseOrderOptions';

export function PurchaseOrderStatusBadge({ status }) {
  const tone = {
    ISSUED: 'info',
    AMENDED: 'warning',
    RECEIVED: 'success',
    BILLED: 'warning',
    PAID: 'success',
    CANCELLED: 'danger',
  }[status] || 'neutral';

  return <span className={`badge badge-${tone}`}>{PO_STATUS_LABELS[status] || humanize(status)}</span>;
}
