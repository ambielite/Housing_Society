import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Small data-loading hook.
 *   const { data, loading, error, reload } = useFetch(() => api.list(params), [params...]);
 * - Re-fetches whenever a value in `deps` changes or reload() is called.
 * - Keeps the previous `data` visible while the next request loads (no flicker).
 * - Ignores responses from outdated requests.
 */
export default function useFetch(fetcher, deps = []) {
  const fetcherRef = useRef(fetcher);
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ key: null, data: null, error: null });
  const requestKey = `${JSON.stringify(deps)}|${tick}`;

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let cancelled = false;
    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ key: requestKey, data, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ key: requestKey, data: null, error });
      });
    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const settled = state.key === requestKey;

  return { data: state.data, error: settled ? state.error : null, loading: !settled, reload };
}
