import { useState, useEffect, useCallback, useRef } from 'react';

export function useAsyncData(fetcher, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(immediate));
  const [error, setError] = useState(null);

  const requestIdRef = useRef(0);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const execute = useCallback(async (...args) => {
    const currentId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const response = await fetcherRef.current(...args);
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
  }, []);

  useEffect(() => {
    if (!immediate) return undefined;

    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        execute();
      }
    });

    return () => {
      cancelled = true;
      requestIdRef.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, immediate, ...deps]);

  return { data, setData, loading, error, reload: execute };
}