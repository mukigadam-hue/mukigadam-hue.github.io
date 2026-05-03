import AdSenseSlot from './AdSenseSlot';

interface BannerAdProps {
  position?: 'top' | 'bottom';
  className?: string;
  slotId?: string;
}

export default function BannerAd({ position = 'bottom', className, slotId }: BannerAdProps) {
  return <AdSenseSlot placement={position} className={className} slotId={slotId} />;
}
