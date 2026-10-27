import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import SelectField from '../../../components/ui/SelectField';
import Alert from '../../../components/ui/Alert';
import { suggestNumber } from './procurementOptions';

const today = () => new Date().toISOString().slice(0, 10);

/** Records a quotation on a vendor's behalf. vendorOptions: invited vendors that haven't quoted yet. */
export default function QuotationForm({ vendorOptions, onSubmit, onCancel, saving, error }) {
  const [values, setValues] = useState({ vendorId: '', quotationNo: suggestNumber('QT'), quotationDate: today(), validUntil: '', document: null });
  const [errors, setErrors] = useState({});

  const onChange = (event) => setValues((v) => ({ ...v, [event.target.name]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = {};
    if (!values.vendorId) next.vendorId = 'Choose the vendor this quote is from.';
    if (!values.quotationNo.trim()) next.quotationNo = 'Enter the quotation number.';
    else if (values.quotationNo.trim().length > 50) next.quotationNo = 'Use 50 characters or fewer.';
    if (!values.quotationDate) next.quotationDate = 'Choose the quotation date.';
    if (values.validUntil && values.validUntil < values.quotationDate) next.validUntil = 'Validity must be on or after the quotation date.';
    if (values.document && values.document.size > 10 * 1024 * 1024) next.document = 'Choose a file that is 10 MB or smaller.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = { vendorId: values.vendorId, quotationNo: values.quotationNo.trim(), quotationDate: values.quotationDate, document: values.document };
    if (values.validUntil) payload.validUntil = values.validUntil;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert>{error}</Alert>}
      <SelectField
        id="vendorId"
        name="vendorId"
        label="Vendor"
        placeholder={vendorOptions.length ? 'Choose a vendor' : 'Every invited vendor has already quoted'}
        options={vendorOptions}
        value={values.vendorId}
        onChange={onChange}
        error={errors.vendorId}
        hint="Only invited vendors can quote, once each."
      />
      <TextField id="quotationNo" name="quotationNo" label="Quotation number" value={values.quotationNo} onChange={onChange} error={errors.quotationNo} />
      <div className="form-grid">
        <TextField id="quotationDate" name="quotationDate" type="date" label="Quotation date" value={values.quotationDate} onChange={onChange} error={errors.quotationDate} />
        <TextField id="validUntil" name="validUntil" type="date" label="Valid until (optional)" value={values.validUntil} onChange={onChange} error={errors.validUntil} />
      </div>
      <div className="field">
        <label htmlFor="quotationDocument">Vendor quotation or invoice</label>
        <input
          id="quotationDocument"
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={(event) => setValues((current) => ({ ...current, document: event.target.files?.[0] || null }))}
        />
        {errors.document && <p className="field-error">{errors.document}</p>}
        <small className="field-hint">PDF, JPG, PNG, or WebP · Up to 10 MB. This file is visible only to authorized users for this society.</small>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Record quotation'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
