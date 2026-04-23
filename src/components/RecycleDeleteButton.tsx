import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';
import { supabase } from '@/integrations/supabase/client';
import { softDeleteRecord, applyStockReversal, type RecyclableTable } from '@/lib/recycleBin';

interface Props {
  table: RecyclableTable;
  recordId: string;
  label?: string;
  onDeleted?: () => void;
  size?: 'sm' | 'icon' | 'default';
  variant?: 'ghost' | 'outline' | 'destructive';
  confirmText?: string;
}

/**
 * Soft-delete a record into the Recycle Bin (Settings → Recycle Bin).
 * Any team member can use this; only owners/admins can permanently delete.
 * Stock side-effects are reversed automatically.
 *
 * The deleter's full name is captured (profiles → user_metadata → email)
 * so the Recycle Bin shows "deleted by <person>" for audit/tracking.
 */
export default function RecycleDeleteButton({
  table, recordId, label, onDeleted, size = 'sm', variant = 'ghost', confirmText,
}: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { refreshData } = useBusiness();
  const [busy, setBusy] = useState(false);
  const [profileName, setProfileName] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle();
      if (!cancelled && data) {
        setProfileName((data as any).full_name || (data as any).email || '');
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  async function onClick() {
    const msg = confirmText ?? t('recycleBin.moveConfirm');
    if (!window.confirm(msg)) return;
    setBusy(true);
    try {
      await applyStockReversal(table, recordId);
      const resolvedName =
        profileName ||
        (user?.user_metadata as any)?.full_name ||
        (user?.user_metadata as any)?.name ||
        user?.email ||
        'Member';
      const ok = await softDeleteRecord(table, recordId, {
        userId: user?.id,
        userName: resolvedName,
      });
      if (ok) {
        toast.success(t('recycleBin.moved'));
        await refreshData();
        onDeleted?.();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size={size} variant={variant} disabled={busy} onClick={onClick} className="text-destructive hover:text-destructive hover:bg-destructive/10">
      <Trash2 className="h-3.5 w-3.5" />
      {label && <span className="ml-1">{label}</span>}
    </Button>
  );
}
