import { useEffect, useId } from 'react';
import { useAdRefresh } from '@/hooks/useAdRefresh';
import { hideNativeAd, requestNativeAd } from '@/lib/despiaAds';
import '@/types/despia.d.ts';

const AD_HEIGHT = 250;

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
    requestNativeAd({ containerId, placement: position, height: AD_HEIGHT });
    onAdLoaded();
    return () => hideNativeAd(containerId);
  }, [position, refreshKey, containerId, onAdLoaded]);

  return (
    <div
      id={containerId}
      data-despia-native-ad="true"
      data-ad-placement={position}
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
