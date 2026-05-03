import AdSenseSlot from './AdSenseSlot';
export { withInlineAds } from './AdSenseSlot';

// Backward-compat shim. The previous implementation tried to call non-existent
// Despia URL-scheme bridges (displaynativead://) which generated zero AdMob
// requests. We now render real AdSense <ins> tags via AdSenseSlot, and Despia's
// WebView API for Ads bridges them into native AdMob ad requests.

interface AdSpaceProps {
  variant?: 'banner' | 'inline' | 'compact';
  className?: string;
  slotId?: string;
}

export default function AdSpace({ variant = 'banner', className, slotId }: AdSpaceProps) {
  return <AdSenseSlot placement={variant} className={className} slotId={slotId} />;
}
