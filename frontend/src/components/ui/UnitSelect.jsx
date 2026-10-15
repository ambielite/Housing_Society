import useUnits from '../../utils/useUnits';
import TextField from './TextField';
import SelectField from './SelectField';

const unitText = (unit) => (unit.bhk ? `${unit.unitNumber} - ${unit.bhk}` : unit.unitNumber);

/**
 * Pick a unit by its number. Value is the unit's ID.
 * If the units list can't be loaded (for example the units module isn't
 * reachable yet), it falls back to a plain box where you paste the unit's ID.
 */
export default function UnitSelect({ id = 'unitId', label = 'Unit', value, onChange, error }) {
  const { units, loading, error: loadError } = useUnits();

  if (loadError) {
    return (
      <TextField
        id={id}
        name={id}
        label={label}
        placeholder="Paste the unit ID"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        error={error}
        hint="Couldn't load the units list, so paste the unit's ID instead."
      />
    );
  }

  const options = units
    .filter((unit) => unit.status !== 'INACTIVE')
    .sort((a, b) => String(a.unitNumber).localeCompare(String(b.unitNumber), undefined, { numeric: true }))
    .map((unit) => ({ value: unit.id, label: unitText(unit) }));

  return (
    <SelectField
      id={id}
      name={id}
      label={label}
      placeholder={loading ? 'Loading units...' : options.length ? 'Choose a unit' : 'No units found'}
      options={options}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={error}
      disabled={loading}
    />
  );
}
