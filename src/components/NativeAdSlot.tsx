import AdSenseSlot from './AdSenseSlot';

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
  return <AdSenseSlot placement={variant} className={className} slotId={slotId} />;
}
