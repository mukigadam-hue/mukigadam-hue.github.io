import { useEffect, useId } from 'react';
import { useAdRefresh } from '@/hooks/useAdRefresh';
import { hideNativeAd, requestNativeAd } from '@/lib/despiaAds';
import '@/types/despia.d.ts';

// Production AdMob Native Ad Unit IDs
export const NATIVE_AD_UNIT_HOME = 'ca-app-pub-9605564713228252/3146574176';
export const NATIVE_AD_UNIT_GENERAL = 'ca-app-pub-9605564713228252/4713172172';

const AD_HEIGHT = 250;

interface NativeAdProps {
  placement?: 'home' | 'general';
  className?: string;
  slotId?: string;
}

/**
 * Empty native-ad placeholder. Despia renders the native ad over this element
 * (silently — system download notifications are suppressed via bridge flags).
 */
export default function NativeAd({ placement = 'general', className, slotId }: NativeAdProps) {
  const reactId = useId().replace(/:/g, '');
  const id = slotId || `native-${placement}-${reactId}`;
  const containerId = `despia-native-${id}`;
  const { refreshKey, onAdLoaded } = useAdRefresh(id);

  useEffect(() => {
    requestNativeAd({ containerId, placement, height: AD_HEIGHT });
    onAdLoaded();
    return () => hideNativeAd(containerId);
  }, [placement, containerId, refreshKey, onAdLoaded]);

  return (
    <div
      id={containerId}
      data-despia-native-ad="true"
      data-ad-placement={placement}
      className={`ad-shimmer w-full flex items-center justify-center overflow-hidden rounded-lg ${className ?? ''}`}
      style={{ height: AD_HEIGHT, maxHeight: AD_HEIGHT }}
      aria-label="Sponsored"
    >
      <span className="ad-loading-label text-[10px] text-muted-foreground/70 tracking-wide">
        Loading Ad…
      </span>
    </div>
  );
}
