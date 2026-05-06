import { useEffect, useRef, useCallback, useState } from 'react';

import { shouldRequestInlineAds } from '@/lib/despiaAds';

const REFRESH_INTERVAL = 60_000; // 60 seconds

// Global map: tracks last refresh timestamp per ad slot
const lastRefreshMap = new Map<string, number>();

/**
 * Hook that manages ad refresh timing with visibility awareness.
 * Returns { shouldRefresh, onAdLoaded, refreshKey }
 */
export function useAdRefresh(slotId: string) {
  const [refreshKey, setRefreshKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleRef = useRef(true);
  const shouldRefresh = shouldRequestInlineAds();

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleNext = useCallback(() => {
    clearTimer();
    const last = lastRefreshMap.get(slotId) || 0;
    const elapsed = Date.now() - last;
    const delay = Math.max(0, REFRESH_INTERVAL - elapsed);

    timerRef.current = setTimeout(() => {
      if (visibleRef.current && document.visibilityState === 'visible') {
        lastRefreshMap.set(slotId, Date.now());
        setRefreshKey(k => k + 1);
      }
      scheduleNext();
    }, delay);
  }, [slotId, clearTimer]);

  const onAdLoaded = useCallback(() => {
    lastRefreshMap.set(slotId, Date.now());
  }, [slotId]);

  // On mount: check if enough time passed, else wait remainder
  useEffect(() => {
    if (!shouldRefresh) return;
    const last = lastRefreshMap.get(slotId) || 0;
    if (Date.now() - last >= REFRESH_INTERVAL) {
      lastRefreshMap.set(slotId, Date.now());
      setRefreshKey(k => k + 1);
    }
    scheduleNext();

    const onVisChange = () => {
      visibleRef.current = document.visibilityState === 'visible';
      if (visibleRef.current) scheduleNext();
      else clearTimer();
    };
    document.addEventListener('visibilitychange', onVisChange);

    return () => {
      clearTimer();
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, [shouldRefresh, slotId, scheduleNext, clearTimer]);

  return { refreshKey, onAdLoaded };
}
