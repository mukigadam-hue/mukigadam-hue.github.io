import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { usePremium } from '@/hooks/usePremium';
import { useAdRefresh } from '@/hooks/useAdRefresh';
import { hideNativeAd, requestNativeAd } from '@/lib/despiaAds';

/**
 * NativeAdSlot — designated inline container for a Despia Native Advanced ad.
 * Fixed 250px tall, light-grey background, with a tiny centered "Loading Ad..."
 * label and shimmer until the native ad is injected. Despia's "Downloading
 * file" system toast is suppressed via bridge flags in despiaAds.ts.
 */

const AD_HEIGHT = 250;

interface NativeAdSlotProps {
  variant?: 'banner' | 'inline' | 'compact';
  className?: string;
  slotId?: string;
}

export default function NativeAdSlot({
  variant = 'inline',
  className,
  slotId,
}: NativeAdSlotProps) {
  const { showAds } = usePremium();
  const reactId = useId().replace(/:/g, '');
  const id = slotId || `nativead-${variant}-${reactId}`;
  const containerId = `despia-native-${id}`;
  const { refreshKey, onAdLoaded } = useAdRefresh(id);
  const slotRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting && entry.intersectionRatio > 0),
      { rootMargin: '96px', threshold: 0.01 },
    );
    observer.observe(slot);
    return () => observer.disconnect();
  }, [refreshKey]);

  useEffect(() => {
    if (!showAds || !isVisible) return;
    requestNativeAd({ containerId, placement: variant, height: AD_HEIGHT });
    onAdLoaded();
    return () => hideNativeAd(containerId);
  }, [showAds, isVisible, variant, refreshKey, containerId, onAdLoaded]);

  if (!showAds) return null;

  return (
    <div
      ref={slotRef}
      id={containerId}
      key={refreshKey}
      data-despia-native-ad="true"
      data-ad-format="native_advanced"
      data-ad-placement={variant}
      className={cn(
        'ad-shimmer w-full overflow-hidden rounded-lg flex items-center justify-center',
        className,
      )}
      style={{ height: AD_HEIGHT, maxHeight: AD_HEIGHT }}
      aria-label="Sponsored"
    >
      <span className="ad-loading-label text-[10px] text-muted-foreground/70 tracking-wide">
        Loading Ad…
      </span>
    </div>
  );
}
