import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import SelectField from '../../../components/ui/SelectField';
import UnitSelect from '../../../components/ui/UnitSelect';
import Alert from '../../../components/ui/Alert';
import { isUuid } from '../../../utils/validators';
import { ALLOCATION_TYPES } from './parkingOptions';

const today = () => new Date().toISOString().slice(0, 10);

/** slotOptions: [{ value, label }] of slots that are active and free. */
export default function AllocationForm({ slotOptions, defaultSlotId = '', onSubmit, onCancel, saving, error }) {
  const [values, setValues] = useState({
    slotId: defaultSlotId,
    unitId: '',
    allocationType: '',
    startDate: today(),
    endDate: '',
    fee: '',
  });
  const [errors, setErrors] = useState({});

  const onChange = (event) => setValues((v) => ({ ...v, [event.target.name]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = {};
    if (!values.slotId) next.slotId = 'Choose a slot.';
    if (!values.unitId.trim()) next.unitId = 'Enter the unit.';
    else if (!isUuid(values.unitId)) next.unitId = "That doesn't look like a valid unit ID.";
    if (!values.allocationType) next.allocationType = 'Choose an allocation type.';
    if (!values.startDate) next.startDate = 'Choose a start date.';
    if (values.endDate && values.endDate < values.startDate) next.endDate = 'The end date must be on or after the start date.';
    if (values.fee !== '' && (Number.isNaN(Number(values.fee)) || Number(values.fee) < 0)) next.fee = 'Enter a fee of 0 or more.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = {
      slotId: values.slotId,
      unitId: values.unitId.trim(),
      allocationType: values.allocationType,
      startDate: values.startDate,
    };
    if (values.endDate) payload.endDate = values.endDate;
    if (values.fee !== '') payload.fee = Number(values.fee);
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert>{error}</Alert>}
      <SelectField
        id="slotId"
        name="slotId"
        label="Slot"
        placeholder={slotOptions.length ? 'Choose a free slot' : 'No free slots available'}
        options={slotOptions}
        value={values.slotId}
        onChange={onChange}
        error={errors.slotId}
      />
      <UnitSelect value={values.unitId} onChange={(unitId) => setValues((v) => ({ ...v, unitId }))} error={errors.unitId} />
      <SelectField
        id="allocationType"
        name="allocationType"
        label="Allocation type"
        placeholder="Choose a type"
        options={ALLOCATION_TYPES}
        value={values.allocationType}
        onChange={onChange}
        error={errors.allocationType}
      />
      <div className="form-grid">
        <TextField id="startDate" name="startDate" type="date" label="Start date" value={values.startDate} onChange={onChange} error={errors.startDate} />
        <TextField id="endDate" name="endDate" type="date" label="End date (optional)" value={values.endDate} onChange={onChange} error={errors.endDate} />
      </div>
      <TextField
        id="fee"
        name="fee"
        type="number"
        min="0"
        step="0.01"
        label="Fee in INR (optional)"
        value={values.fee}
        onChange={onChange}
        error={errors.fee}
      />
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Allocate slot'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
