import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import ParkingTabs from '../components/ParkingTabs';
import AreaForm from '../components/AreaForm';
import { ActiveBadge } from '../components/ParkingBadges';
import { PARKING_TYPES, friendlyDeleteError, labelOf } from '../components/parkingOptions';
import { filterRecords } from '../utils/searchRecords';
import ParkingSearchToolbar from '../components/ParkingSearchToolbar';

export default function AreaListPage({ embedded = false, searchTerm = '', searchValue = '', onSearchChange }) {
  const { hasPermission } = useAuth();
  const { societyId } = useSociety();
  const canSeeSlots = hasPermission('PARKING_SLOT_READ');

  const areas = useFetch(() => (societyId ? parkingApi.listAreas({ societyId }) : Promise.resolve(null)), [societyId]);
  // Slots are only loaded to show "how many slots" per area.
  const slots = useFetch(() => (societyId && canSeeSlots ? parkingApi.listSlots() : Promise.resolve(null)), [societyId, canSeeSlots]);

  const [dialog, setDialog] = useState(null); // { mode: 'create' } | { mode: 'edit', area }
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');
  const [pageError, setPageError] = useState('');

  const newButton = hasPermission('PARKING_AREA_CREATE') && (
    <button type="button" className="btn btn-primary" onClick={() => openDialog({ mode: 'create' })}>
      <Plus size={16} /> New area
    </button>
  );

  function openDialog(next) {
    setSaveError('');
    setNotice('');
    setPageError('');
    setDialog(next);
  }

  if (!societyId) {
    return (
      <PageContainer title="Parking" subtitle="Areas, slots and who they are allocated to." hideHeader={embedded}>
        {!embedded && <ParkingTabs />}
        <SocietyIdPrompt />
      </PageContainer>
    );
  }

  const countByArea = {};
  (slots.data || []).forEach((slot) => {
    countByArea[slot.parking_area_id] = (countByArea[slot.parking_area_id] || 0) + 1;
  });

  const save = async (payload) => {
    setSaving(true);
    setSaveError('');
    try {
      if (dialog.mode === 'edit') {
        await parkingApi.updateArea(dialog.area.id, payload);
        setNotice('Area updated.');
      } else {
        await parkingApi.createArea({ ...payload, societyId });
        setNotice('Area created. Add slots to it from the Slots tab.');
      }
      setDialog(null);
      areas.reload();
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await parkingApi.deleteArea(deleting.id);
      setNotice(`Area "${deleting.name}" deleted.`);
      areas.reload();
    } catch (err) {
      setPageError(friendlyDeleteError(err, 'area'));
    } finally {
      setSaving(false);
      setDeleting(null);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Area',
      render: (area) => (
        <>
          <span className="cell-title">{area.name}</span>
          {area.zone && <span className="cell-sub">Zone {area.zone}</span>}
        </>
      ),
    },
    { key: 'type', header: 'Type', render: (area) => labelOf(PARKING_TYPES, area.parking_type) },
    ...(canSeeSlots ? [{ key: 'slots', header: 'Slots', render: (area) => countByArea[area.id] || 0 }] : []),
    { key: 'status', header: 'Status', render: (area) => <ActiveBadge status={area.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (area) => (
        <div className="row-actions">
          {hasPermission('PARKING_AREA_UPDATE') && (
            <button type="button" className="table-action-button" aria-label={`Edit ${area.name}`} title="Edit" onClick={() => openDialog({ mode: 'edit', area })}>
              <Pencil size={17} aria-hidden="true" />
            </button>
          )}
          {hasPermission('PARKING_AREA_DELETE') && (
            <button type="button" className="table-action-button danger" aria-label={`Delete ${area.name}`} title="Delete" onClick={() => setDeleting(area)}>
              <Trash2 size={17} aria-hidden="true" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="Parking" subtitle="Areas, slots and who they are allocated to." actions={embedded ? null : newButton} hideHeader={embedded}>
      {!embedded && <ParkingTabs />}
      {notice && <Alert variant="success">{notice}</Alert>}
      {pageError && <Alert>{pageError}</Alert>}
      {embedded && <ParkingSearchToolbar value={searchValue} onChange={onSearchChange} placeholder="Search areas, zones, types, and status…" action={newButton} />}

      <DataTable
        columns={columns}
        tableClassName="parking-vehicle-table"
        rows={filterRecords(areas.data, searchTerm, (area) => `${labelOf(PARKING_TYPES, area.parking_type)} ${area.zone || ''} ${countByArea[area.id] || 0}`)}
        loading={areas.loading}
        error={areas.error ? getErrorMessage(areas.error) : ''}
        onRetry={areas.reload}
        emptyTitle={searchTerm ? 'No matching parking areas' : 'No parking areas yet'}
        emptyMessage={searchTerm ? 'Try another area name, zone, type, or status.' : 'An area is a zone such as a basement or open yard. Create one, then add slots to it.'}
        emptyAction={newButton || null}
      />

      {dialog && (
        <Modal title={dialog.mode === 'edit' ? 'Edit parking area' : 'New parking area'} onClose={() => setDialog(null)} busy={saving}>
          <AreaForm mode={dialog.mode} area={dialog.area} onSubmit={save} onCancel={() => setDialog(null)} saving={saving} error={saveError} />
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this area?"
        message={`"${deleting?.name || ''}" will be deleted. This only works if it has no slots. Otherwise, mark it inactive instead.`}
        confirmLabel="Delete area"
        danger
        busy={saving}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </PageContainer>
  );
}
