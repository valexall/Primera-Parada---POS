import { useState, useEffect, useRef } from 'react';

interface UseSmartPollingOptions<T> {
  fetcher: () => Promise<T>;
  interval?: number; // intervalo base en ms (default: 30s)
  maxInterval?: number; // intervalo máximo en ms (default: 60s)
  backoffMultiplier?: number; // multiplicador de backoff (default: 1.5)
  enabled?: boolean;
  compareData?: (prev: T | null, current: T) => boolean; // función para comparar si hay cambios
}

/**
 * Hook de polling inteligente con backoff exponencial
 * Reduce frecuencia si no hay cambios, aumenta si hay actividad
 */
export function useSmartPolling<T>(options: UseSmartPollingOptions<T>) {
  const {
    fetcher,
    interval = 30000,
    maxInterval = 60000,
    backoffMultiplier = 1.5,
    enabled = true,
    compareData = (prev, current) => JSON.stringify(prev) === JSON.stringify(current)
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentInterval, setCurrentInterval] = useState(interval);
  const timeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (!enabled) return;

    const poll = async () => {
      try {
        const result = await fetcher();

        if (!isMountedRef.current) return;

        const hasChanges = !compareData(data, result);

        if (hasChanges) {
          console.log('[useSmartPolling] Cambios detectados - reseteando intervalo');
          setData(result);
          setCurrentInterval(interval); // Resetear a intervalo base
        } else {
          console.log('[useSmartPolling] Sin cambios - aumentando intervalo');
          // Aumentar intervalo (backoff) pero no exceder máximo
          setCurrentInterval(prev => Math.min(prev * backoffMultiplier, maxInterval));
        }

        setIsLoading(false);
      } catch (error) {
        console.error('[useSmartPolling] Error:', error);
      }

      // Programar siguiente poll
      if (isMountedRef.current) {
        timeoutRef.current = window.setTimeout(poll, currentInterval);
      }
    };

    // Iniciar polling
    poll();

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, fetcher, interval, maxInterval, backoffMultiplier, currentInterval, compareData, data]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return { data, isLoading };
}
