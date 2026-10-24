import { humanize } from '../../../utils/format';
import { PO_STATUS_LABELS } from './purchaseOrderOptions';

export function PurchaseOrderStatusBadge({ status }) {
  const tone = {
    ISSUED: 'pending',
    AMENDED: 'pending',
    RECEIVED: 'success',
    BILLED: 'pending',
    PAID: 'success',
    CANCELLED: 'danger',
  }[status] || 'neutral';

  return <span className={`moveinout-status moveinout-status-${tone}`}>{PO_STATUS_LABELS[status] || humanize(status)}</span>;
}
