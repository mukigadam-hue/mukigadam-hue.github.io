import { useEffect, useId } from 'react';
import { useAdRefresh } from '@/hooks/useAdRefresh';
import { hideNativeAd, requestNativeAd } from '@/lib/despiaAds';
import '@/types/despia.d.ts';

interface BannerAdProps {
  position?: 'top' | 'bottom';
  className?: string;
  slotId?: string;
}

export default function BannerAd({ position = 'bottom', className, slotId }: BannerAdProps) {
  const reactId = useId().replace(/:/g, '');
  const id = slotId || `banner-${position}-${reactId}`;
  const containerId = `despia-native-${id}`;
  const { refreshKey, onAdLoaded } = useAdRefresh(id);

  useEffect(() => {
    requestNativeAd({ containerId, placement: position, height: 50 });
    onAdLoaded();
    return () => hideNativeAd(containerId);
  }, [position, refreshKey, containerId, onAdLoaded]);

  return (
    <div
      id={containerId}
      data-despia-native-ad="true"
      data-ad-placement={position}
      className={`w-full flex items-center justify-center transition-none ${className ?? ''}`}
      style={{ minHeight: 50 }}
      aria-hidden="true"
    />
  );
}
