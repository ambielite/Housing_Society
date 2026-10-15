import useUnits from '../../utils/useUnits';

/** Compact "All units" dropdown for toolbars. Hidden if the units list can't be loaded. */
export default function UnitFilter({ value, onChange }) {
  const { units, error } = useUnits();
  if (error) return null;

  const sorted = [...units].sort((a, b) => String(a.unitNumber).localeCompare(String(b.unitNumber), undefined, { numeric: true }));

  return (
    <select className="input toolbar-select" aria-label="Filter by unit" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">All units</option>
      {sorted.map((unit) => (
        <option key={unit.id} value={unit.id}>
          {unit.unitNumber}
        </option>
      ))}
    </select>
  );
}
