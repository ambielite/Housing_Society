import api from '../lib/axios';
import useSociety from '../app/store/useSociety';
import useFetch from './useFetch';

/**
 * Loads the units list (GET /units, owned by the societies/units module).
 * One request is shared by every component on screen and remembered until the
 * society changes, so dropdowns and table labels don't each hit the server.
 *
 * The units module's response shape isn't fixed in our docs, so this accepts
 * a plain array or an { data: [...] } / { data: { units: [...] } } wrapper,
 * and camelCase or snake_case field names.
 */
const toList = (body) => {
  if (Array.isArray(body)) return body;
  const inner = body?.data ?? body;
  if (Array.isArray(inner)) return inner;
  return inner?.units || inner?.records || inner?.rows || [];
};

const normalizeUnit = (unit) => ({
  id: unit.id,
  unitNumber: unit.unitNumber ?? unit.unit_number ?? '',
  bhk: unit.bhk ?? null,
  societyId: unit.societyId ?? unit.society_id ?? null,
  status: unit.status ?? null,
});

let cache = null; // { societyId, promise }

const loadUnits = (societyId) => {
  if (!cache || cache.societyId !== societyId) {
    const promise = api.get('/units').then((response) =>
      toList(response.data)
        .map(normalizeUnit)
        // Keep this society's units. Units with no society recorded can't be told apart, so they stay.
        .filter((unit) => !societyId || !unit.societyId || unit.societyId === societyId)
    );
    cache = { societyId, promise };
    promise.catch(() => {
      cache = null; // let the next attempt try again
    });
  }
  return cache.promise;
};

/** Returns { units, byId, loading, error, reload }. `error` is set when the units list can't be reached. */
export default function useUnits() {
  const { societyId } = useSociety();
  const { data, loading, error, reload } = useFetch(() => loadUnits(societyId), [societyId]);

  const units = data || [];
  const byId = new Map(units.map((unit) => [unit.id, unit]));
  return { units, byId, loading, error, reload };
}
