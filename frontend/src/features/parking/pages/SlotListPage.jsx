import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
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
import SlotForm from '../components/SlotForm';
import AllocationForm from '../components/AllocationForm';
import { ActiveBadge } from '../components/ParkingBadges';
import { SLOT_TYPES, VEHICLE_TYPES, friendlyDeleteError, labelOf } from '../components/parkingOptions';

export default function SlotListPage() {
  const { hasPermission } = useAuth();
  const { societyId } = useSociety();
  const [searchParams] = useSearchParams();
  const canSeeAllocations = hasPermission('PARKING_ALLOCATION_READ');

  const [areaFilter, setAreaFilter] = useState(searchParams.get('area') || '');
  const [statusFilter, setStatusFilter] = useState('');

  const areas = useFetch(() => (societyId ? parkingApi.listAreas({ societyId }) : Promise.resolve(null)), [societyId]);
  const slots = useFetch(
    () => (societyId ? parkingApi.listSlots({ parkingAreaId: areaFilter, status: statusFilter }) : Promise.resolve(null)),
    [societyId, areaFilter, statusFilter]
  );
  // Active allocations tell us which slots are taken.
  const allocations = useFetch(
    () => (societyId && canSeeAllocations ? parkingApi.listAllocations({ status: 'ACTIVE' }) : Promise.resolve(null)),
    [societyId, canSeeAllocations]
  );

  const [dialog, setDialog] = useState(null); // { type: 'create' | 'edit' | 'allocate', slot? }
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

  const newButton = hasPermission('PARKING_SLOT_CREATE') && (
    <button type="button" className="btn btn-primary" onClick={() => openDialog({ type: 'create' })}>
      New slot
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

  const allAreas = areas.data || [];
  const areaById = new Map(allAreas.map((a) => [a.id, a]));
  const allocationBySlot = new Map((allocations.data || []).map((a) => [a.slot_id, a]));

  // The slots endpoint isn't society-aware, so keep only slots inside this society's areas.
  const rows = slots.data && areas.data ? slots.data.filter((s) => areaById.has(s.parking_area_id)) : null;

  const areaOptionsAll = allAreas.map((a) => ({ value: a.id, label: a.name }));
  const areaOptionsActive = allAreas.filter((a) => a.status === 'ACTIVE').map((a) => ({ value: a.id, label: a.name }));

  const save = async (payload) => {
    setSaving(true);
    setSaveError('');
    try {
      if (dialog.type === 'edit') {
        await parkingApi.updateSlot(dialog.slot.id, payload);
        setNotice('Slot updated.');
      } else if (dialog.type === 'allocate') {
        await parkingApi.createAllocation(payload);
        setNotice('Slot allocated.');
        allocations.reload();
      } else {
        await parkingApi.createSlot(payload);
        setNotice('Slot created.');
      }
      setDialog(null);
      slots.reload();
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await parkingApi.deleteSlot(deleting.id);
      setNotice(`Slot "${deleting.slot_code}" deleted.`);
      slots.reload();
    } catch (err) {
      setPageError(friendlyDeleteError(err, 'slot'));
    } finally {
      setSaving(false);
      setDeleting(null);
    }
  };

  const columns = [
    { key: 'slot_code', header: 'Slot', render: (slot) => <span className="cell-title">{slot.slot_code}</span> },
    {
      key: 'area',
      header: 'Area',
      render: (slot) => areaById.get(slot.parking_area_id)?.name || '-',
    },
    { key: 'slot_type', header: 'Slot type', render: (slot) => labelOf(SLOT_TYPES, slot.slot_type) },
    { key: 'vehicle_type', header: 'Vehicle', render: (slot) => labelOf(VEHICLE_TYPES, slot.vehicle_type) },
    { key: 'status', header: 'Status', render: (slot) => <ActiveBadge status={slot.status} /> },
    ...(canSeeAllocations
      ? [
          {
            key: 'availability',
            header: 'Availability',
            render: (slot) => {
              if (slot.status !== 'ACTIVE') return '-';
              const allocation = allocationBySlot.get(slot.id);
              return allocation ? (
                <>
                  <span className="badge badge-pending">Allocated</span>{' '}
                  <span className="muted">
                    to <UnitLabel unitId={allocation.unit_id} />
                  </span>
                </>
              ) : (
                <span className="badge badge-active">Free</span>
              );
            },
          },
        ]
      : []),
    {
      key: 'actions',
      header: '',
      render: (slot) => {
        const free = slot.status === 'ACTIVE' && !allocationBySlot.has(slot.id);
        return (
          <div className="row-actions">
            {free && canSeeAllocations && hasPermission('PARKING_ALLOCATION_CREATE') && (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => openDialog({ type: 'allocate', slot })}>
                Allocate
              </button>
            )}
            {hasPermission('PARKING_SLOT_UPDATE') && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => openDialog({ type: 'edit', slot })}>
                Edit
              </button>
            )}
            {hasPermission('PARKING_SLOT_DELETE') && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDeleting(slot)}>
                Delete
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const filtersActive = Boolean(areaFilter || statusFilter);
  const dialogTitle = { create: 'New parking slot', edit: 'Edit parking slot', allocate: 'Allocate slot' };

  return (
    <PageContainer title="Parking" subtitle="Areas, slots and who they are allocated to." actions={newButton}>
      <ParkingTabs />
      {notice && <Alert variant="success">{notice}</Alert>}
      {pageError && <Alert>{pageError}</Alert>}

      <div className="toolbar">
        <select className="input toolbar-select" aria-label="Filter by area" value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}>
          <option value="">All areas</option>
          {areaOptionsAll.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select className="input toolbar-select" aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={slots.loading || areas.loading}
        error={slots.error || areas.error ? getErrorMessage(slots.error || areas.error) : ''}
        onRetry={() => {
          slots.reload();
          areas.reload();
        }}
        emptyTitle={filtersActive ? 'No slots match these filters' : 'No parking slots yet'}
        emptyMessage={filtersActive ? 'Try a different area or status.' : 'Create an area first, then add slots (bays) to it.'}
        emptyAction={
          filtersActive ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setAreaFilter('');
                setStatusFilter('');
              }}
            >
              Clear filters
            </button>
          ) : (
            newButton || null
          )
        }
      />

      {dialog && (
        <Modal title={dialogTitle[dialog.type]} onClose={() => setDialog(null)} busy={saving}>
          {dialog.type === 'allocate' ? (
            <AllocationForm
              slotOptions={[
                {
                  value: dialog.slot.id,
                  label: `${dialog.slot.slot_code} - ${areaById.get(dialog.slot.parking_area_id)?.name || 'Unknown area'}`,
                },
              ]}
              defaultSlotId={dialog.slot.id}
              onSubmit={save}
              onCancel={() => setDialog(null)}
              saving={saving}
              error={saveError}
            />
          ) : (
            <SlotForm
              mode={dialog.type}
              slot={dialog.slot}
              areaOptions={dialog.type === 'edit' ? areaOptionsAll : areaOptionsActive}
              defaultAreaId={areaFilter}
              onSubmit={save}
              onCancel={() => setDialog(null)}
              saving={saving}
              error={saveError}
            />
          )}
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this slot?"
        message={`Slot "${deleting?.slot_code || ''}" will be deleted. This only works if it was never allocated. Otherwise, mark it inactive instead.`}
        confirmLabel="Delete slot"
        danger
        busy={saving}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </PageContainer>
  );
}
