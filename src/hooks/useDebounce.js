import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para debouncing de valores
 * Útil para inputs de busca e API calls
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para debouncing de callbacks
 * Útil para funções que são executadas frequentemente
 */
export function useDebouncedCallback(callback, delay = 300, deps = []) {
  const [debounceTimer, setDebounceTimer] = useState(null);

  const debouncedCallback = useCallback((...args) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);

    setDebounceTimer(newTimer);
  }, [callback, delay, ...deps]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return debouncedCallback;
}

export default useDebounce;