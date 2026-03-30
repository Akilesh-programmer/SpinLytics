import { useState, useEffect, useCallback } from 'react';

/**
 * Generic data-fetching hook
 * @param {Function} fetchFn — async function that returns API response
 * @param {Array} deps — dependency array for re-fetching
 */
export function useApi(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchFn();
      setData(response.data);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

export default useApi;
