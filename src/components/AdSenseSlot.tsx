import { useEffect, useId, useRef } from 'react';
import { cn } from '@/lib/utils';
import { usePremium } from '@/hooks/usePremium';
import { useAdRefresh } from '@/hooks/useAdRefresh';
import {
  ADSENSE_PUBLISHER_ID,
  AdPlacement,
  adLog,
  adSlotForPlacement,
  pushAdsbygoogle,
} from '@/lib/despiaAds';

/**
 * AdSenseSlot — renders a real Google AdSense <ins> tag that Despia's
 * WebView API for Ads bridges into AdMob native ad requests.
 *
 * Sizing: Native Advanced ads in AdMob are typically delivered as a 300x250
 * Medium Rectangle when bridged through the WebView. We pin the slot to that
 * exact size so Google never rejects creatives for layout overflow.
 */

const AD_WIDTH = 300;
const AD_HEIGHT = 250;

interface AdSenseSlotProps {
  placement?: AdPlacement;
  className?: string;
  slotId?: string;
}

export default function AdSenseSlot({
  placement = 'inline',
  className,
  slotId,
}: AdSenseSlotProps) {
  const { showAds } = usePremium();
  const reactId = useId().replace(/:/g, '');
  const id = slotId || `adsense-${placement}-${reactId}`;
  const { refreshKey, onAdLoaded } = useAdRefresh(id);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dataAdSlot = adSlotForPlacement(placement);

  useEffect(() => {
    if (!showAds) return;
    // Defer one tick so the <ins> is in the DOM before we push.
    const t = setTimeout(() => {
      adLog(`[AD-STATUS] AdSense push for slot=${dataAdSlot} placement=${placement}`);
      pushAdsbygoogle();
      onAdLoaded();
    }, 0);
    return () => clearTimeout(t);
  }, [showAds, refreshKey, dataAdSlot, placement, onAdLoaded]);

  if (!showAds) return null;

  return (
    <div
      ref={containerRef}
      key={refreshKey}
      data-ad-placement={placement}
      className={cn(
        'ad-shimmer w-full overflow-hidden rounded-lg flex items-center justify-center mx-auto',
        className,
      )}
      style={{ maxWidth: AD_WIDTH, height: AD_HEIGHT, maxHeight: AD_HEIGHT }}
      aria-label="Sponsored"
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'inline-block', width: AD_WIDTH, height: AD_HEIGHT }}
        data-ad-client={ADSENSE_PUBLISHER_ID}
        data-ad-slot={dataAdSlot}
      />
    </div>
  );
}

/** Utility: interleave ad slots every `interval` items in a list. */
export function withInlineAds<T>(
  items: T[],
  renderItem: (item: T, index: number) => React.ReactNode,
  interval = 8,
): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  items.forEach((item, i) => {
    result.push(renderItem(item, i));
    if ((i + 1) % interval === 0 && i + 1 < items.length) {
      result.push(<AdSenseSlot key={`ad-${i}`} placement="inline" />);
    }
  });
  return result;
}
