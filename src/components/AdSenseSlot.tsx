import { useEffect, useId, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { usePremium } from '@/hooks/usePremium';
import { useAdRefresh } from '@/hooks/useAdRefresh';
import {
  ADSENSE_PUBLISHER_ID,
  AdPlacement,
  adLog,
  adSlotForPlacement,
  ensureAdsenseScript,
  isNativeAdPlacement,
  isDespiaNativeShell,
  pushAdsbygoogle,
} from '@/lib/despiaAds';

/**
 * AdSenseSlot — renders a real Google AdSense <ins> tag that Despia's
 * WebView API for Ads bridges into AdMob native ad requests.
 *
 * Responsive sizing across all Android gadgets (phones, foldables, tablets):
 *   - Native (inline / home / general / compact): min 300x250, scales up to
 *     468x300 on tablets while keeping a guaranteed paint area Google can fill.
 *   - Banner (top / bottom): fluid full width up to a 728px leaderboard with
 *     a 90px min height so banners render correctly on tablets too.
 *
 * `max-width: 100%` ensures we never overflow narrow phones in landscape or
 * split-screen mode. Min-height guarantees AdSense never sees a 0-height slot
 * (which is the #1 reason ad requests get silently dropped).
 */

const NATIVE_MIN_WIDTH = 300;
const NATIVE_MIN_HEIGHT = 250;
const NATIVE_MAX_WIDTH = 468;
const NATIVE_MAX_HEIGHT = 300;
const BANNER_MIN_HEIGHT = 90;
const BANNER_MAX_WIDTH = 728;

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
  const insRef = useRef<HTMLModElement | null>(null);
  const dataAdSlot = adSlotForPlacement(placement);
  const isNative = isNativeAdPlacement(placement);
  const nativeShell = useMemo(() => isDespiaNativeShell(), []);

  useEffect(() => {
    if (!showAds) return;
    if (!nativeShell) return;
    ensureAdsenseScript();

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const requestAd = () => {
      if (cancelled) return;
      const slot = insRef.current;
      if (!slot || slot.offsetWidth <= 0) {
        retryTimer = setTimeout(requestAd, 250);
        return;
      }

      adLog(`[AD-STATUS] AdSense request slot=${dataAdSlot} placement=${placement} width=${slot.offsetWidth}`);
      pushAdsbygoogle();
      onAdLoaded();
    };

    const t = setTimeout(requestAd, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [showAds, nativeShell, refreshKey, dataAdSlot, placement, onAdLoaded]);

  if (!showAds) return null;

  const isBanner = placement === 'top' || placement === 'bottom' || placement === 'banner';

  const containerStyle: React.CSSProperties = isBanner
    ? {
        width: '100%',
        maxWidth: BANNER_MAX_WIDTH,
        minHeight: BANNER_MIN_HEIGHT,
      }
    : {
        width: '100%',
        maxWidth: NATIVE_MAX_WIDTH,
        minHeight: NATIVE_MIN_HEIGHT,
      };

  const insStyle: React.CSSProperties = isBanner
    ? { display: 'block', width: '100%', minHeight: BANNER_MIN_HEIGHT }
    : { display: 'block', width: '100%', minHeight: NATIVE_MIN_HEIGHT };

  return (
    <div
      ref={containerRef}
      key={refreshKey}
      data-ad-placement={placement}
      className={cn(
        'ad-shimmer w-full max-w-full overflow-hidden rounded-lg flex items-center justify-center mx-auto',
        className,
      )}
      style={containerStyle}
      aria-label="Sponsored"
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={insStyle}
        data-ad-client={ADSENSE_PUBLISHER_ID}
        data-ad-slot={dataAdSlot}
        data-ad-format={isNative ? 'fluid' : 'auto'}
        data-ad-layout={isNative ? 'in-article' : undefined}
        data-full-width-responsive="true"
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
