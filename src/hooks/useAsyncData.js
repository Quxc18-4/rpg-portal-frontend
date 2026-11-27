import { useState, useEffect, useCallback, useRef } from 'react';

export function useAsyncData(fetcher, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(immediate));
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);

  const execute = useCallback(
    async (...args) => {
      const currentId = ++requestIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const response = await fetcher(...args);
        if (currentId === requestIdRef.current) {
          setData(response?.data !== undefined ? response.data : response);
        }
        return response;
      } catch (err) {
        if (currentId === requestIdRef.current) {
          setError(err);
        }
        return null;
      } finally {
        if (currentId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { data, setData, loading, error, reload: execute };
}