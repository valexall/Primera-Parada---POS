import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCachedDataOptions<T> {
  fetcher: () => Promise<T>;
  cacheDuration?: number; // en milisegundos, default: 30 segundos
  enabled?: boolean;
}

/**
 * Hook para cachear datos y evitar refetch innecesarios
 * Útil para datos que no cambian frecuentemente (estadísticas, resúmenes)
 */
export function useCachedData<T>(options: UseCachedDataOptions<T>) {
  const { fetcher, cacheDuration = 30000, enabled = true } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime;

    // Si no es forzado y el caché es válido, no hacer fetch
    if (!force && timeSinceLastFetch < cacheDuration && data !== null) {
      console.log(`[useCachedData] Usando caché (válido por ${Math.round((cacheDuration - timeSinceLastFetch) / 1000)}s más)`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      
      if (isMountedRef.current) {
        setData(result);
        setLastFetchTime(Date.now());
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetcher, cacheDuration, enabled, lastFetchTime, data]);

  // Fetch inicial
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch: () => fetchData(true), // Forzar refetch
  };
}
