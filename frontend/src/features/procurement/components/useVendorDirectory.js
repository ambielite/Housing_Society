import useFetch from '../../../utils/useFetch';
import * as vendorsApi from '../../vendors/api/vendors.api';

/**
 * Vendor names for a society (first 100), so tables can show names instead of IDs and
 * forms can offer a vendor dropdown. Fails softly: without vendor-read permission the
 * lists are simply empty and `error` is set.
 */
export default function useVendorDirectory(societyId) {
  const { data, loading, error, reload } = useFetch(
    () => (societyId ? vendorsApi.listVendors({ societyId, limit: 100 }) : Promise.resolve(null)),
    [societyId]
  );
  const vendors = data ? data.vendors : [];
  const byId = new Map(vendors.map((v) => [v.id, v]));
  const nameOf = (id) => byId.get(id)?.legal_name || `Vendor ${String(id).slice(0, 8)}`;
  return { vendors, byId, nameOf, loading, error, reload };
}
