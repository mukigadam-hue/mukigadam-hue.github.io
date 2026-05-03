import AdSenseSlot from './AdSenseSlot';

export const NATIVE_AD_UNIT_HOME = 'ca-app-pub-9605564713228252/3146574176';
export const NATIVE_AD_UNIT_GENERAL = 'ca-app-pub-9605564713228252/4713172172';

interface NativeAdProps {
  placement?: 'home' | 'general';
  className?: string;
  slotId?: string;
}

export default function NativeAd({ placement = 'general', className, slotId }: NativeAdProps) {
  return <AdSenseSlot placement={placement} className={className} slotId={slotId} />;
}
