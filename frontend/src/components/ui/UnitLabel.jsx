import useUnits from '../../utils/useUnits';
import { shortId } from '../../utils/format';

/** Shows a unit's number. If the units list isn't available, shows the start of the unit's ID instead. */
export default function UnitLabel({ unitId }) {
  const { byId } = useUnits();
  if (!unitId) return '-';

  const unit = byId.get(unitId);
  if (unit?.unitNumber) return <span title={unitId}>{unit.unitNumber}</span>;

  return (
    <span className="mono" title={unitId}>
      {shortId(unitId)}
    </span>
  );
}
