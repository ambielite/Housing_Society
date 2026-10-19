import { useState } from 'react';
import { Plus } from 'lucide-react';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import { formatCurrency, formatDate } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import * as parkingApi from '../api/parking.api';
import PageContainer from '../../../components/layout/PageContainer';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import UnitLabel from '../../../components/ui/UnitLabel';
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import ParkingTabs from '../components/ParkingTabs';
import AllocationForm from '../components/AllocationForm';
import EndAllocationForm from '../components/EndAllocationForm';
import { AllocationStatusBadge } from '../components/ParkingBadges';
import { ALLOCATION_TYPES, friendlyDeleteError, labelOf } from '../components/parkingOptions';

export default function AllocationListPage() {
  const { hasPermission } = useAuth();
  const { societyId } = useSociety();
  const [statusFilter, setStatusFilter] = useState('');

  // The allocations endpoint isn't society-aware, so slots and areas are loaded
  // too: they let us keep only this society's allocations and show slot names.
  const allocations = useFetch(() => (societyId ? parkingApi.listAllocations() : Promise.resolve(null)), [societyId]);
  const slots = useFetch(() => (societyId ? parkingApi.listSlots() : Promise.resolve(null)), [societyId]);
  const areas = useFetch(() => (societyId ? parkingApi.listAreas({ societyId }) : Promise.resolve(null)), [societyId]);

  const [dialog, setDialog] = useState(null); // { type: 'create' } | { type: 'end', allocation }
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');
  const [pageError, setPageError] = useState('');

  function openDialog(next) {
    setSaveError('');
    setNotice('');
    setPageError('');
    setDialog(next);
  }

  const canCreate = hasPermission('PARKING_ALLOCATION_CREATE');
  const newButton = canCreate && (
    <button type="button" className="btn btn-primary" onClick={() => openDialog({ type: 'create' })}>
      <Plus size={16} /> New allocation
    </button>
  );

  if (!societyId) {
    return (
      <PageContainer title="Parking" subtitle="Areas, slots and who they are allocated to.">
        <ParkingTabs />
        <SocietyIdPrompt />
      </PageContainer>
    );
  }

  const ready = Boolean(allocations.data) && !slots.loading && !areas.loading;
  const areaById = new Map((areas.data || []).map((a) => [a.id, a]));
  const societySlots = (slots.data || []).filter((s) => areaById.has(s.parking_area_id));
  const slotById = new Map(societySlots.map((s) => [s.id, s]));
  const scopeKnown = Boolean(slots.data && areas.data);

  const inSociety = allocations.data ? allocations.data.filter((a) => !scopeKnown || slotById.has(a.slot_id)) : null;
  const rows = ready && inSociety ? inSociety.filter((a) => !statusFilter || a.status === statusFilter) : null;

  // Slots that are active and have no active allocation can be allocated.
  const takenSlotIds = new Set((allocations.data || []).filter((a) => a.status === 'ACTIVE').map((a) => a.slot_id));
  const freeSlotOptions = societySlots
    .filter((s) => s.status === 'ACTIVE' && !takenSlotIds.has(s.id))
    .map((s) => ({ value: s.id, label: `${s.slot_code} - ${areaById.get(s.parking_area_id)?.name || 'Unknown area'}` }));

  const save = async (payload) => {
    setSaving(true);
    setSaveError('');
    try {
      if (dialog.type === 'end') {
        await parkingApi.endAllocation(dialog.allocation.id, payload);
        setNotice('Allocation ended. The slot is free again.');
      } else {
        await parkingApi.createAllocation(payload);
        setNotice('Slot allocated.');
      }
      setDialog(null);
      allocations.reload();
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await parkingApi.deleteAllocation(deleting.id);
      setNotice('Allocation deleted.');
      allocations.reload();
    } catch (err) {
      setPageError(friendlyDeleteError(err, 'allocation'));
    } finally {
      setSaving(false);
      setDeleting(null);
    }
  };

  const columns = [
    {
      key: 'slot',
      header: 'Slot',
      render: (allocation) => {
        const slot = slotById.get(allocation.slot_id);
        return (
          <>
            <span className="cell-title">{slot?.slot_code || 'Unknown slot'}</span>
            {slot && <span className="cell-sub">{areaById.get(slot.parking_area_id)?.name}</span>}
          </>
        );
      },
    },
    { key: 'unit', header: 'Unit', render: (allocation) => <UnitLabel unitId={allocation.unit_id} /> },
    { key: 'type', header: 'Type', render: (allocation) => labelOf(ALLOCATION_TYPES, allocation.allocation_type) },
    {
      key: 'period',
      header: 'Period',
      render: (allocation) => `${formatDate(allocation.start_date)} to ${allocation.end_date ? formatDate(allocation.end_date) : 'open-ended'}`,
    },
    { key: 'fee', header: 'Fee', render: (allocation) => formatCurrency(allocation.fee) },
    { key: 'status', header: 'Status', render: (allocation) => <AllocationStatusBadge status={allocation.status} /> },
    {
      key: 'actions',
      header: '',
      render: (allocation) => (
        <div className="row-actions">
          {allocation.status === 'ACTIVE' && hasPermission('PARKING_ALLOCATION_UPDATE') && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => openDialog({ type: 'end', allocation })}>
              End
            </button>
          )}
          {hasPermission('PARKING_ALLOCATION_DELETE') && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDeleting(allocation)}>
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="Parking" subtitle="Areas, slots and who they are allocated to." actions={newButton}>
      <ParkingTabs />
      {notice && <Alert variant="success">{notice}</Alert>}
      {pageError && <Alert>{pageError}</Alert>}

      <div className="toolbar">
        <select className="input toolbar-select" aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={allocations.loading}
        error={allocations.error ? getErrorMessage(allocations.error) : ''}
        onRetry={allocations.reload}
        emptyTitle={statusFilter ? 'No allocations with this status' : 'No allocations yet'}
        emptyMessage={statusFilter ? 'Try a different status.' : 'Allocate a free slot to a unit to see it here.'}
        emptyAction={
          statusFilter ? (
            <button type="button" className="btn btn-secondary" onClick={() => setStatusFilter('')}>
              Clear filter
            </button>
          ) : (
            newButton || null
          )
        }
      />

      {dialog && (
        <Modal title={dialog.type === 'end' ? 'End allocation' : 'New allocation'} onClose={() => setDialog(null)} busy={saving}>
          {dialog.type === 'end' ? (
            <EndAllocationForm onSubmit={save} onCancel={() => setDialog(null)} saving={saving} error={saveError} />
          ) : (
            <AllocationForm slotOptions={freeSlotOptions} onSubmit={save} onCancel={() => setDialog(null)} saving={saving} error={saveError} />
          )}
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this allocation?"
        message="This removes the record for good. To keep a history of who had the slot, end the allocation instead."
        confirmLabel="Delete allocation"
        danger
        busy={saving}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </PageContainer>
  );
}
