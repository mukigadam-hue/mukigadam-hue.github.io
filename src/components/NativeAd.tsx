import { useEffect, useId } from 'react';
import { useAdRefresh } from '@/hooks/useAdRefresh';
import { hideNativeAd, requestNativeAd } from '@/lib/despiaAds';
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
 * Empty native-ad placeholder. Despia renders the native ad over this element;
 * the web app never loads Google ad URLs inside the WebView.
 */
export default function NativeAd({ placement = 'general', className, slotId }: NativeAdProps) {
  const reactId = useId().replace(/:/g, '');
  const id = slotId || `native-${placement}-${reactId}`;
  const containerId = `despia-native-${id}`;
  const { refreshKey, onAdLoaded } = useAdRefresh(id);

  useEffect(() => {
    requestNativeAd({ containerId, placement, height: 100 });
    onAdLoaded();
    return () => hideNativeAd(containerId);
  }, [placement, containerId, refreshKey, onAdLoaded]);

  return (
    <div
      id={containerId}
      data-despia-native-ad="true"
      data-ad-placement={placement}
      className={`w-full flex items-center justify-center transition-none ${className ?? ''}`}
      style={{ minHeight: 100 }}
      aria-hidden="true"
    />
  );
}
