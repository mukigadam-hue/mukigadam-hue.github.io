import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useBusiness } from '@/context/BusinessContext';
import {
  bulkCleanup, findCleanupCandidates, PERIOD_LABEL_KEY,
  type CleanupTable, type CleanupPeriod,
} from '@/lib/bulkCleanup';

interface Props {
  table: CleanupTable;
  /** Optional explicit business id; falls back to currentBusiness.id */
  businessId?: string;
  /** Callback after deletion completes */
  onDone?: () => void;
  className?: string;
}

const PERIODS: CleanupPeriod[] = ['last_week', 'last_month', 'older_3m', 'older_year'];

/**
 * Bulk-delete OLD records (sales/purchases/services/orders/bookings) for a
 * business. Outstanding debts are protected and the receipt archive remains.
 * Owner/Admin only — the parent decides where to render this button.
 */
export default function BulkCleanupButton({ table, businessId, onDone, className }: Props) {
  const { t } = useTranslation();
  const { currentBusiness, userRole, refreshData } = useBusiness();
  const bid = businessId || currentBusiness?.id || '';
  const allowed = userRole === 'owner' || userRole === 'admin';

  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<Record<CleanupPeriod, number | null>>({
    last_week: null, last_month: null, older_3m: null, older_year: null,
  });
  const [busy, setBusy] = useState<CleanupPeriod | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  if (!allowed || !bid) return null;

  async function openDialog() {
    setOpen(true);
    setCounts({ last_week: null, last_month: null, older_3m: null, older_year: null });
    const entries = await Promise.all(
      PERIODS.map(async p => [p, (await findCleanupCandidates(table, bid, p)).length] as const),
    );
    setCounts(Object.fromEntries(entries) as any);
  }

  async function runCleanup(period: CleanupPeriod) {
    const total = counts[period] ?? 0;
    if (!total) {
      toast.info(t('bulkCleanup.none', 'No matching records found'));
      return;
    }
    const ok = window.confirm(
      t('bulkCleanup.confirm', { count: total, defaultValue: `Permanently delete ${total} records? This cannot be undone. Records with debts and your Receipt Archive will be kept.` }),
    );
    if (!ok) return;

    setBusy(period);
    setProgress({ done: 0, total });
    try {
      const removed = await bulkCleanup(table, bid, period, (done, t2) => setProgress({ done, total: t2 }));
      toast.success(t('bulkCleanup.success', { count: removed, defaultValue: `Deleted ${removed} old records` }));
      await refreshData();
      onDone?.();
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message || 'Cleanup failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Button
        type="button" size="sm" variant="destructive"
        onClick={openDialog}
        className={`shadow-md font-semibold min-h-[40px] px-3 ${className || ''}`}
      >
        <Trash2 className="h-4 w-4 mr-1.5" />
        {t('bulkCleanup.button', 'Delete Old Records')}
      </Button>

      <Dialog open={open} onOpenChange={o => !busy && setOpen(o)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('bulkCleanup.title', 'Delete old records')}</DialogTitle>
            <DialogDescription>
              {t('bulkCleanup.description', 'Permanently remove old records. Records with outstanding debt and the Receipt Archive will be kept.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {PERIODS.map(p => {
              const c = counts[p];
              const isBusy = busy === p;
              return (
                <button
                  key={p}
                  disabled={busy !== null || c === 0}
                  onClick={() => runCleanup(p)}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border min-h-[44px] text-left disabled:opacity-50 hover:bg-accent transition-colors"
                >
                  <span className="text-sm font-medium">{t(PERIOD_LABEL_KEY[p])}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {isBusy
                      ? <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />{progress.done}/{progress.total}</span>
                      : c === null ? '…' : t('bulkCleanup.preview', { count: c, defaultValue: `${c} record(s)` })}
                  </span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
