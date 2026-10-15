import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import SelectField from '../../../components/ui/SelectField';
import Alert from '../../../components/ui/Alert';
import { DAY_TYPES, MEMBER_TYPES } from './amenityOptions';

export default function PricingRuleForm({ rule, amenityId, onSubmit, onCancel, saving, error }) {
  const isEdit = Boolean(rule);
  const [values, setValues] = useState({
    memberType: rule?.member_type || '',
    dayType: rule?.day_type || '',
    price: rule?.price ?? '',
    effectiveFrom: rule?.effective_from ? String(rule.effective_from).slice(0, 10) : '',
    effectiveTo: rule?.effective_to ? String(rule.effective_to).slice(0, 10) : '',
  });
  const [errors, setErrors] = useState({});

  const change = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    const next = {};
    if (!isEdit && !values.memberType) next.memberType = 'Choose member type.';
    if (!isEdit && !values.dayType) next.dayType = 'Choose day type.';
    if (values.price === '' || Number.isNaN(Number(values.price)) || Number(values.price) < 0) next.price = 'Enter a valid price.';
    if (!values.effectiveFrom) next.effectiveFrom = 'Choose the effective-from date.';
    if (values.effectiveTo && values.effectiveTo < values.effectiveFrom) next.effectiveTo = 'Effective-to must be on or after effective-from.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = {
      price: Number(values.price),
      effectiveFrom: values.effectiveFrom,
      effectiveTo: values.effectiveTo || null,
    };
    if (!isEdit) {
      payload.amenityId = amenityId;
      payload.memberType = values.memberType;
      payload.dayType = values.dayType;
    }
    onSubmit(payload);
  };

  return (
    <form onSubmit={submit} noValidate>
      {error && <Alert>{error}</Alert>}
      <div className="form-grid">
        <SelectField id="rule-member" name="memberType" label="Member type" placeholder="Choose" options={MEMBER_TYPES} value={values.memberType} onChange={change} error={errors.memberType} disabled={isEdit} />
        <SelectField id="rule-day" name="dayType" label="Day type" placeholder="Choose" options={DAY_TYPES} value={values.dayType} onChange={change} error={errors.dayType} disabled={isEdit} />
      </div>
      <TextField id="rule-price" name="price" type="number" min="0" step="0.01" label="Price (INR)" value={values.price} onChange={change} error={errors.price} />
      <div className="form-grid">
        <TextField id="rule-from" name="effectiveFrom" type="date" label="Effective from" value={values.effectiveFrom} onChange={change} error={errors.effectiveFrom} />
        <TextField id="rule-to" name="effectiveTo" type="date" label="Effective to (optional)" value={values.effectiveTo} onChange={change} error={errors.effectiveTo} />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create pricing rule'}</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
}
