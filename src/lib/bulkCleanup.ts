import { supabase } from '@/integrations/supabase/client';
import { permanentDeleteRecord, type RecyclableTable } from './recycleBin';

/**
 * Bulk cleanup helpers.
 *
 * Permanently removes OLD transactional records (sales, purchases, services,
 * orders, property_bookings) for a business. Records with outstanding debt
 * are NEVER deleted — they remain until cleared.
 *
 * The `receipts` archive table is NEVER touched, so historical receipts
 * remain available in Settings → Receipt Archive.
 */

export type CleanupTable = Extract<
  RecyclableTable,
  'sales' | 'purchases' | 'services' | 'orders' | 'property_bookings'
>;

export type CleanupPeriod = 'last_week' | 'last_month' | 'older_3m' | 'older_year';

/** ISO cutoff: records with created_at <= cutoff are eligible. */
export function cutoffForPeriod(period: CleanupPeriod): string {
  const now = new Date();
  const d = new Date(now);
  switch (period) {
    case 'last_week':    d.setDate(now.getDate() - 7); break;
    case 'last_month':   d.setMonth(now.getMonth() - 1); break;
    case 'older_3m':     d.setMonth(now.getMonth() - 3); break;
    case 'older_year':   d.setFullYear(now.getFullYear() - 1); break;
  }
  return d.toISOString();
}

/**
 * Find IDs eligible for cleanup. Excludes:
 *   • records with outstanding debt (payment_status != 'paid' OR balance > 0)
 *   • already soft-deleted records
 */
export async function findCleanupCandidates(
  table: CleanupTable,
  businessId: string,
  period: CleanupPeriod,
): Promise<string[]> {
  const cutoff = cutoffForPeriod(period);
  const q = supabase
    .from(table as any)
    .select('id, payment_status, balance')
    .eq('business_id', businessId)
    .lte('created_at', cutoff)
    .is('deleted_at', null);

  const { data, error } = await q;
  if (error) {
    console.warn('[bulkCleanup] query failed:', error.message);
    return [];
  }
  return (data || [])
    .filter((r: any) => {
      const paid = (r.payment_status || 'paid') === 'paid';
      const bal = Number(r.balance || 0);
      return paid && bal <= 0;
    })
    .map((r: any) => r.id as string);
}

/**
 * Permanently delete the eligible records. Receipts archive is NOT touched.
 * Returns the number of records actually removed.
 */
export async function bulkCleanup(
  table: CleanupTable,
  businessId: string,
  period: CleanupPeriod,
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  const ids = await findCleanupCandidates(table, businessId, period);
  if (!ids.length) return 0;

  let done = 0;
  // Run in small parallel batches to keep the UI responsive.
  const BATCH = 5;
  for (let i = 0; i < ids.length; i += BATCH) {
    const slice = ids.slice(i, i + BATCH);
    await Promise.all(slice.map(id => permanentDeleteRecord(table, id)));
    done += slice.length;
    onProgress?.(done, ids.length);
  }
  return done;
}

export const PERIOD_LABEL_KEY: Record<CleanupPeriod, string> = {
  last_week:  'bulkCleanup.lastWeek',
  last_month: 'bulkCleanup.lastMonth',
  older_3m:   'bulkCleanup.older3Months',
  older_year: 'bulkCleanup.olderYear',
};
