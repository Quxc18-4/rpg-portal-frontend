import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useQueryParams(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(() => {
    const merged = { ...defaults };
    for (const [key, val] of searchParams.entries()) {
      merged[key] = val;
    }
    return merged;
  }, [searchParams, defaults]);

  const updateParams = useCallback(
    (patch, { resetPage = true } = {}) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);

        if (resetPage && patch.page === undefined && next.has('page')) {
          next.set('page', '1');
        }

        for (const [key, value] of Object.entries(patch)) {
          if (value === undefined || value === null || value === '') {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const resetParams = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  return { params, updateParams, resetParams };
}