import { useEffect, useState, useRef } from 'react';
import { useAdRefresh } from '@/hooks/useAdRefresh';
import { adLog } from '@/components/AdMobManager';
import '@/types/despia.d.ts';

// Production AdMob Native Ad Unit IDs
export const NATIVE_AD_UNIT_HOME = 'ca-app-pub-9605564713228252/3146574176';
export const NATIVE_AD_UNIT_GENERAL = 'ca-app-pub-9605564713228252/4713172172';

interface NativeAdProps {
  /** Which native ad unit to load. Defaults to general. */
  placement?: 'home' | 'general';
  className?: string;
  slotId?: string;
}

/**
 * Native AdMob ad component (rendered via Despia native shell).
 * Falls back to nothing on web — pair with <AdSpace /> for web fallback.
 * Auto-refreshes every 60s while visible.
 */
export default function NativeAd({ placement = 'general', className, slotId }: NativeAdProps) {
  const adUnitId = placement === 'home' ? NATIVE_AD_UNIT_HOME : NATIVE_AD_UNIT_GENERAL;
  const id = slotId || `native-${placement}`;
  const containerId = `admob-native-${id}`;
  const { refreshKey, onAdLoaded } = useAdRefresh(id);
  const [isNative, setIsNative] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    const hasAdMob = !!window.despia?.AdMob?.showNative;
    const hasStartIO = !!window.despia?.StartIO?.showNative;
    if (!hasAdMob && !hasStartIO) return;
    setIsNative(true);

    let cancelled = false;

    const tryStartIOFallback = async (): Promise<boolean> => {
      if (!window.despia?.StartIO?.showNative) {
        adLog('[AD-FAIL] Start.io bridge unavailable');
        return false;
      }
      adLog('[AD-STATUS] Requesting Start.io Native Ad...');
      try {
        await window.despia?.StartIO?.hideNative?.(containerId).catch(() => {});
        if (cancelled) return false;
        await window.despia.StartIO.showNative({ containerId });
        adLog('[AD-SUCCESS] Start.io ad loaded');
        return true;
      } catch (e: any) {
        adLog(`[AD-FAIL] Start.io failed — reason: ${e?.message || e?.code || 'unknown'}`);
        return false;
      }
    };

    const loadAd = async () => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      try {
        if (hasAdMob) {
          adLog('[AD-STATUS] Requesting AdMob Native Ad...');
          try {
            await window.despia?.AdMob?.hideNative?.(containerId).catch(() => {});
            if (cancelled) return;
            await window.despia!.AdMob!.showNative!({ adId: adUnitId, containerId });
            adLog('[AD-SUCCESS] AdMob ad loaded');
            if (!cancelled) {
              setError(null);
              onAdLoaded();
            }
            return;
          } catch (admobErr: any) {
            const code = admobErr?.code ?? admobErr?.errorCode ?? 'N/A';
            const msg = admobErr?.message || String(admobErr);
            adLog('[AD-RETRY] AdMob failed. Switching to Start.io fallback...');
            adLog(`[AD-ERROR] AdMob error code: ${code} — ${msg}`);
            const ok = await tryStartIOFallback();
            if (!cancelled) {
              if (ok) {
                setError(null);
                onAdLoaded();
              } else {
                setError(msg || 'Ad failed');
              }
            }
            return;
          }
        }
        const ok = await tryStartIOFallback();
        if (!cancelled) {
          if (ok) {
            setError(null);
            onAdLoaded();
          } else {
            setError('Ad failed');
          }
        }
      } finally {
        loadingRef.current = false;
      }
    };
    loadAd();

    return () => {
      cancelled = true;
      window.despia?.AdMob?.hideNative?.(containerId).catch(() => {});
      window.despia?.StartIO?.hideNative?.(containerId).catch(() => {});
    };
  }, [adUnitId, containerId, refreshKey, onAdLoaded]);

  if (!isNative) return null;

  return (
    <div
      id={containerId}
      className={`w-full flex items-center justify-center transition-none ${className ?? ''}`}
      style={{ minHeight: 100 }}
    >
      {error && <p className="text-[10px] text-muted-foreground">{error}</p>}
    </div>
  );
}
