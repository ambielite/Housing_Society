import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useFetch from '../../../utils/useFetch';
import { formatDateTime } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import * as vehiclesApi from '../api/vehicles.api';
import PageContainer from '../../../components/layout/PageContainer';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import UnitLabel from '../../../components/ui/UnitLabel';
import { FullPageLoader } from '../../../components/ui/Spinner';
import { CredentialStatusBadge, VehicleStatusBadge } from '../components/VehicleBadges';
import VehicleStatusForm from '../components/VehicleStatusForm';
import CredentialForm from '../components/CredentialForm';
import { CREDENTIAL_TYPES, VEHICLE_TYPES, labelOf } from '../components/vehicleOptions';

export default function VehicleDetailPage() {
  const { vehicleId } = useParams();
  const location = useLocation();
  const { hasPermission } = useAuth();

  const vehicle = useFetch(() => vehiclesApi.getVehicle(vehicleId), [vehicleId]);
  const credentials = useFetch(() => vehiclesApi.listCredentials(vehicleId), [vehicleId]);

  const [dialog, setDialog] = useState(null); // 'status' | 'credential'
  const [revoking, setRevoking] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [pageError, setPageError] = useState('');

  const target = vehicle.data;

  if (vehicle.loading && !target) return <FullPageLoader />;

  if (vehicle.error && !target) {
    const notFound = vehicle.error.response?.status === 404;
    return (
      <div className="empty-state">
        <h1>{notFound ? 'Vehicle not found' : "Couldn't load this vehicle"}</h1>
        <p>{notFound ? 'It may have been removed, or the link is wrong.' : getErrorMessage(vehicle.error)}</p>
        <p>
          <Link to="/vehicles">Back to vehicles</Link>
        </p>
      </div>
    );
  }

  const canUpdate = hasPermission('VEHICLE_UPDATE');
  const canCredential = hasPermission('VEHICLE_CREDENTIAL_ASSIGN');

  const openDialog = (name) => {
    setSaveError('');
    setNotice('');
    setPageError('');
    setDialog(name);
  };

  const saveStatus = async (status) => {
    setSaving(true);
    setSaveError('');
    try {
      await vehiclesApi.updateVehicleStatus(vehicleId, status);
      setDialog(null);
      setNotice('Vehicle status updated.');
      vehicle.reload();
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveCredential = async (payload) => {
    setSaving(true);
    setSaveError('');
    try {
      await vehiclesApi.assignCredential(vehicleId, payload);
      setDialog(null);
      setNotice('Credential added.');
      credentials.reload();
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const revoke = async () => {
    setSaving(true);
    try {
      await vehiclesApi.revokeCredential(vehicleId, revoking.id);
      setNotice('Credential revoked.');
      credentials.reload();
    } catch (err) {
      setPageError(getErrorMessage(err));
    } finally {
      setSaving(false);
      setRevoking(null);
    }
  };

  const credentialColumns = [
    { key: 'type', header: 'Type', render: (c) => labelOf(CREDENTIAL_TYPES, c.credential_type) },
    { key: 'value', header: 'Number', render: (c) => <span className="mono">{c.credential_value}</span> },
    { key: 'issued', header: 'Issued', render: (c) => formatDateTime(c.issued_at) },
    { key: 'expires', header: 'Expires', render: (c) => formatDateTime(c.expires_at, 'Never') },
    { key: 'status', header: 'Status', render: (c) => <CredentialStatusBadge status={c.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (c) =>
        canCredential && c.status === 'ACTIVE' ? (
          <div className="row-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRevoking(c)}>
              Revoke
            </button>
          </div>
        ) : null,
    },
  ];

  const actions = (
    <>
      {canUpdate && (
        <Link to={`/vehicles/${vehicleId}/edit`} className="btn btn-secondary">
          Edit
        </Link>
      )}
      {canUpdate && (
        <button type="button" className="btn btn-secondary" onClick={() => openDialog('status')}>
          Change status
        </button>
      )}
    </>
  );

  return (
    <PageContainer
      title={target.registration_no}
      subtitle={[target.make, target.model].filter(Boolean).join(' ') || labelOf(VEHICLE_TYPES, target.vehicle_type)}
      actions={actions}
    >
      <p className="back-link">
        <Link to="/vehicles">&larr; All vehicles</Link>
      </p>

      {notice && <Alert variant="success">{notice}</Alert>}
      {pageError && <Alert>{pageError}</Alert>}

      <div className="card section">
        <h2 className="section-title">Details</h2>
        <dl className="details">
          <dt>Status</dt>
          <dd>
            <VehicleStatusBadge status={target.status} />
          </dd>
          <dt>Type</dt>
          <dd>{labelOf(VEHICLE_TYPES, target.vehicle_type)}</dd>
          <dt>Unit</dt>
          <dd>
            <UnitLabel unitId={target.unit_id} />
          </dd>
          <dt>Make</dt>
          <dd>{target.make || '-'}</dd>
          <dt>Model</dt>
          <dd>{target.model || '-'}</dd>
          <dt>Colour</dt>
          <dd>{target.color || '-'}</dd>
          <dt>Registered</dt>
          <dd>{formatDateTime(target.created_at)}</dd>
        </dl>
      </div>

      <div className="section">
        <div className="section-head">
          <div>
            <h2 className="section-title">Access credentials</h2>
            <p className="muted section-hint">RFID cards, stickers or QR codes that let this vehicle through the gate.</p>
          </div>
          {canCredential && (
            <button type="button" className="btn btn-primary" onClick={() => openDialog('credential')}>
              Add credential
            </button>
          )}
        </div>
        <DataTable
          columns={credentialColumns}
          rows={credentials.data}
          loading={credentials.loading}
          error={credentials.error ? getErrorMessage(credentials.error) : ''}
          onRetry={credentials.reload}
          emptyTitle="No credentials yet"
          emptyMessage="Add an RFID card, sticker or QR code for this vehicle."
        />
      </div>

      {dialog === 'status' && (
        <Modal title="Change vehicle status" onClose={() => setDialog(null)} busy={saving}>
          <VehicleStatusForm currentStatus={target.status} onSubmit={saveStatus} onCancel={() => setDialog(null)} saving={saving} error={saveError} />
        </Modal>
      )}
      {dialog === 'credential' && (
        <Modal title="Add access credential" onClose={() => setDialog(null)} busy={saving}>
          <CredentialForm onSubmit={saveCredential} onCancel={() => setDialog(null)} saving={saving} error={saveError} />
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(revoking)}
        title="Revoke this credential?"
        message={`Number ${revoking?.credential_value || ''} will stop working at the gate. It can't be given to another vehicle afterwards.`}
        confirmLabel="Revoke credential"
        danger
        busy={saving}
        onConfirm={revoke}
        onCancel={() => setRevoking(null)}
      />
    </PageContainer>
  );
}
