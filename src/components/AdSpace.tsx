import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { usePremium } from '@/hooks/usePremium';
import { useAdRefresh } from '@/hooks/useAdRefresh';
import { hideNativeAd, requestNativeAd } from '@/lib/despiaAds';

/**
 * Empty native-ad placeholder for Despia. Fixed 250px tall light-grey
 * shimmer with a centered tiny "Loading Ad..." label. Despia injects the
 * native ad over this box; the system "Downloading file" toast is suppressed
 * via bridge flags in despiaAds.ts.
 */

const AD_HEIGHT = 250;

interface AdSpaceProps {
  variant?: 'banner' | 'inline' | 'compact';
  className?: string;
  slotId?: string;
}

export default function AdSpace({ variant = 'banner', className, slotId }: AdSpaceProps) {
  const { showAds } = usePremium();
  const reactId = useId().replace(/:/g, '');
  const id = slotId || `adspace-${variant}-${reactId}`;
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

/**
 * Utility: interleave ad placeholders every `interval` items in a list.
 */
export function withInlineAds<T>(
  items: T[],
  renderItem: (item: T, index: number) => React.ReactNode,
  interval = 8,
): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  items.forEach((item, i) => {
    result.push(renderItem(item, i));
    if ((i + 1) % interval === 0 && i + 1 < items.length) {
      result.push(<AdSpace key={`ad-${i}`} variant="inline" />);
    }
  });
  return result;
}
