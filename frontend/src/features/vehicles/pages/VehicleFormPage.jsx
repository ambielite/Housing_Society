import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import { getErrorMessage } from '../../../lib/axios';
import * as vehiclesApi from '../api/vehicles.api';
import PageContainer from '../../../components/layout/PageContainer';
import { FullPageLoader } from '../../../components/ui/Spinner';
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import VehicleForm from '../components/VehicleForm';

/** One page for two routes: /vehicles/new (register) and /vehicles/:vehicleId/edit (edit). */
export default function VehicleFormPage() {
  const { vehicleId } = useParams();
  const isEdit = Boolean(vehicleId);
  const navigate = useNavigate();
  const { societyId } = useSociety();
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const existing = useFetch(() => (isEdit ? vehiclesApi.getVehicle(vehicleId) : Promise.resolve(null)), [vehicleId]);

  if (isEdit && existing.loading && !existing.data) return <FullPageLoader />;
  if (isEdit && existing.error && !existing.data) {
    return (
      <div className="empty-state">
        <h1>Couldn't load this vehicle</h1>
        <p>{getErrorMessage(existing.error)}</p>
        <p>
          <Link to="/vehicles">Back to vehicles</Link>
        </p>
      </div>
    );
  }

  if (!isEdit && !societyId) {
    return (
      <PageContainer title="Register vehicle" subtitle="Add a resident's vehicle.">
        <SocietyIdPrompt />
      </PageContainer>
    );
  }

  const handleSubmit = async (payload) => {
    setSaving(true);
    setSubmitError('');
    try {
      if (isEdit) {
        await vehiclesApi.updateVehicle(vehicleId, payload);
        navigate(`/vehicles/${vehicleId}`, { state: { notice: 'Vehicle updated.' } });
      } else {
        const created = await vehiclesApi.createVehicle({ ...payload, societyId });
        navigate(`/vehicles/${created.id}`, { state: { notice: 'Vehicle registered. You can now add an access credential.' } });
      }
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <PageContainer
      title={isEdit ? 'Edit vehicle' : 'Register vehicle'}
      subtitle={isEdit ? existing.data.registration_no : "Add a resident's vehicle."}
    >
      <VehicleForm
        mode={isEdit ? 'edit' : 'create'}
        vehicle={existing.data}
        onSubmit={handleSubmit}
        cancelTo={isEdit ? `/vehicles/${vehicleId}` : '/vehicles'}
        onCancel={() => navigate(isEdit ? `/vehicles/${vehicleId}` : '/vehicles')}
        saving={saving}
        error={submitError}
      />
    </PageContainer>
  );
}
