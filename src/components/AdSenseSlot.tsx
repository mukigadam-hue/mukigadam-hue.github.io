/**
 * AdSenseSlot — DEPRECATED.
 *
 * Despia does not support Native Advanced ads. We have permanently removed
 * the inline AdSense `<ins>` slots in favour of Despia's Interstitial ads
 * (see `src/lib/interstitialAd.ts`). This component is kept as a no-op so
 * existing imports across the codebase keep compiling without leaving
 * empty ad placeholders in the UI.
 */

export type AdPlacement =
  | 'banner'
  | 'inline'
  | 'compact'
  | 'home'
  | 'general'
  | 'top'
  | 'bottom';

interface AdSenseSlotProps {
  placement?: AdPlacement;
  className?: string;
  slotId?: string;
}

export default function AdSenseSlot(_props: AdSenseSlotProps) {
  return null;
}

/** Backwards-compat: previously interleaved ad slots between list items. */
export function withInlineAds<T>(
  items: T[],
  renderItem: (item: T, index: number) => React.ReactNode,
  _interval = 8,
): React.ReactNode[] {
  return items.map((item, i) => renderItem(item, i));
}
