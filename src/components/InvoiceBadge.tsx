import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/hooks/useCurrency';

interface Props {
  grandTotal: number;
  amountPaid: number;
  paymentStatus?: string;
}

export default function InvoiceBadge({ grandTotal, amountPaid, paymentStatus }: Props) {
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const balance = Math.max(grandTotal - amountPaid, 0);
  const status = paymentStatus || (amountPaid <= 0 ? 'unpaid' : amountPaid >= grandTotal ? 'paid' : 'partial');

  if (status === 'paid') {
    return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-success/10 text-success">✅ {t('invoice.receipt')}</span>;
  }
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${status === 'partial' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}`}>
      📄 {t('invoice.invoice')} · {t('invoice.balance')}: {fmt(balance)}
    </span>
  );
}
