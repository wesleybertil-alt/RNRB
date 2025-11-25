import { useEffect, useCallback, useRef } from 'react';
import { triggerEinkRefresh, debounce } from '../lib/eink-utils';

/**
 * Hook for managing e-ink refresh triggers
 */
export const useEinkRefresh = () => {
  const debouncedRefresh = useRef(debounce(triggerEinkRefresh, 100));

  // Trigger refresh on component mount
  useEffect(() => {
    triggerEinkRefresh();
  }, []);

  // Manual refresh trigger
  const refresh = useCallback(() => {
    triggerEinkRefresh();
  }, []);

  // Debounced refresh for rapid updates
  const debouncedTrigger = useCallback(() => {
    debouncedRefresh.current();
  }, []);

  return {
    refresh,
    debouncedTrigger,
  };
};

/**
 * Hook to trigger refresh when a value changes
 */
export const useRefreshOnChange = <T>(value: T) => {
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      triggerEinkRefresh();
      prevValue.current = value;
    }
  }, [value]);
};
