import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs `loader` on mount (and whenever `reload()` is called) and tracks its
 * loading / error / data state independently of other requests on the page.
 * `loader` should be stable (module-level function or useCallback).
 */
export function useAsyncData(loader, { initialData = null, immediate = true, initialLoading = immediate } = {}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const reload = useCallback(
    async ({ silent = false } = {}) => {
      const id = ++requestId.current;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const result = await loader();
        if (id === requestId.current) setData(result);
        return result;
      } catch (err) {
        if (id === requestId.current) setError(err.message || 'Something went wrong.');
        return undefined;
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [loader]
  );

  useEffect(() => {
    if (immediate) reload();
  }, [immediate, reload]);

  // Ignore responses that arrive after unmount.
  useEffect(
    () => () => {
      requestId.current += 1;
    },
    []
  );

  return { data, setData, loading, error, reload };
}
