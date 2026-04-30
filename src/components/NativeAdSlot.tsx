import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { usePremium } from '@/hooks/usePremium';
import { useAdRefresh } from '@/hooks/useAdRefresh';
import { hideNativeAd, requestNativeAd } from '@/lib/despiaAds';

/**
 * NativeAdSlot — designated inline container for a Despia Native Advanced ad.
 *
 * - Stays INSIDE the app layout (no fullscreen, no interstitial, no rewarded).
 * - Renders an empty <div> with a unique `id` that the Despia native shell
 *   targets when filling the Native Advanced ad.
 * - Hidden for premium users (no ads).
 *
 * Usage:
 *   <NativeAdSlot variant="inline" />
 */

const HEIGHT_BY_VARIANT = {
  banner: 80,
  inline: 120,
  compact: 60,
} as const;

type Variant = keyof typeof HEIGHT_BY_VARIANT;

interface NativeAdSlotProps {
  variant?: Variant;
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
  // The Despia native shell uses this DOM id as the target container.
  const containerId = `despia-native-${id}`;
  const { refreshKey, onAdLoaded } = useAdRefresh(id);
  const slotRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Only request the ad when the slot scrolls into view (saves impressions).
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
    requestNativeAd({
      containerId,
      placement: variant,
      height: HEIGHT_BY_VARIANT[variant],
    });
    onAdLoaded();
    return () => hideNativeAd(containerId);
  }, [showAds, isVisible, variant, refreshKey, containerId, onAdLoaded]);

  if (!showAds) return null;

  const height = HEIGHT_BY_VARIANT[variant];

  return (
    <div
      ref={slotRef}
      id={containerId}
      key={refreshKey}
      data-despia-native-ad="true"
      data-ad-format="native_advanced"
      data-ad-placement={variant}
      className={cn(
        'w-full overflow-hidden rounded-lg bg-muted/20 transition-none',
        className,
      )}
      style={{ height, maxHeight: height }}
      aria-label="Sponsored"
    />
  );
}
