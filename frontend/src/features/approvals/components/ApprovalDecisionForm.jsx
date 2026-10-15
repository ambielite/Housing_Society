const DECISIONS = [
  ['APPROVE', 'Approve'],
  ['REJECT', 'Reject'],
  ['INFO_REQUESTED', 'Request information'],
];

export default function ApprovalDecisionForm({ onSubmit, onCancel, saving = false, error = '' }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      decision: form.get('decision'),
      remarks: form.get('remarks') || '',
      isFinalLevel: form.get('isFinalLevel') === 'true',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="stack-form">
      {error && <div className="form-error">{error}</div>}
      <label className="field">
        <span>Decision</span>
        <select name="decision" className="input" defaultValue="APPROVE" required>
          {DECISIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Remarks</span>
        <textarea name="remarks" className="input" rows="4" maxLength="500" placeholder="Optional remarks" />
      </label>
      <label className="check-row">
        <input type="checkbox" name="isFinalLevel" value="true" defaultChecked />
        <span>This is the final approval level</span>
      </label>
      <div className="dialog-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Record decision'}</button>
      </div>
    </form>
  );
}
