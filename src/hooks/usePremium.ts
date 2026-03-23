import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PremiumLimits {
  isPremium: boolean;
  loading: boolean;
  maxWorkers: number;
  maxContacts: number;
  canUploadItemPhotos: boolean;
  canShareReceipts: boolean;
  canDownloadReceipts: boolean;
  canPrintReceipts: boolean;
  canUseScanner: boolean;
  canScreenshot: boolean;
  showAds: boolean;
  maxAssets: number;
  maxPropertyWorkers: number;
  maxRenters: number;
  canUploadAssetPhotos: boolean;
}

const FREE_LIMITS: PremiumLimits = {
  isPremium: false,
  loading: false,
  maxWorkers: 3,
  maxContacts: 15,
  canUploadItemPhotos: false,
  canShareReceipts: false,
  canDownloadReceipts: false,
  canPrintReceipts: false,
  canUseScanner: false,
  canScreenshot: false,
  showAds: true,
  maxAssets: 3,
  maxPropertyWorkers: 1,
  maxRenters: 15,
  canUploadAssetPhotos: false,
};

const PREMIUM_LIMITS: PremiumLimits = {
  isPremium: true,
  loading: false,
  maxWorkers: Infinity,
  maxContacts: Infinity,
  canUploadItemPhotos: true,
  canShareReceipts: true,
  canDownloadReceipts: true,
  canPrintReceipts: true,
  canUseScanner: true,
  canScreenshot: true,
  showAds: false,
  maxAssets: Infinity,
  maxPropertyWorkers: Infinity,
  maxRenters: Infinity,
  canUploadAssetPhotos: true,
};

/**
 * Premium is determined by the BUSINESS OWNER's subscription status.
 * 
 * Rules:
 * - Worker at a premium business → gets premium features at THAT business only
 * - Worker switches to own non-premium business → no premium features
 * - Premium user working at non-premium boss's business → no premium at that business
 * - Expired premium → existing photos stay visible, but no new uploads/changes allowed
 * 
 * Automatically reads the current business owner from localStorage cache.
 */
export function usePremium(): PremiumLimits {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { setLoading(false); return; }

      // Determine the business owner to check premium for
      let checkId = user.id; // fallback to current user
      
      try {
        const currentBusinessId = localStorage.getItem('biztrack_current_business');
        if (currentBusinessId) {
          const businesses = JSON.parse(localStorage.getItem('biztrack_cache_businesses') || '[]');
          const currentBiz = businesses.find((b: any) => b.id === currentBusinessId);
          if (currentBiz?.owner_id) {
            // Use the business owner's premium status, not the current user's
            checkId = currentBiz.owner_id;
          }
        }
      } catch {
        // fallback to user's own premium
      }

      const { data } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', checkId)
        .single();

      if (!cancelled) {
        setIsPremium(data?.is_premium ?? false);
        setLoading(false);
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  // Re-check when business changes
  useEffect(() => {
    let cancelled = false;
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'biztrack_current_business') {
        // Business switched — re-check premium
        check();
      }
    };

    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      let checkId = user.id;
      try {
        const currentBusinessId = localStorage.getItem('biztrack_current_business');
        if (currentBusinessId) {
          const businesses = JSON.parse(localStorage.getItem('biztrack_cache_businesses') || '[]');
          const currentBiz = businesses.find((b: any) => b.id === currentBusinessId);
          if (currentBiz?.owner_id) {
            checkId = currentBiz.owner_id;
          }
        }
      } catch {}

      const { data } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', checkId)
        .single();

      if (!cancelled) {
        setIsPremium(data?.is_premium ?? false);
      }
    }

    window.addEventListener('storage', handleStorage);
    return () => { 
      cancelled = true;
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  if (loading) return { ...FREE_LIMITS, loading: true };
  return isPremium ? PREMIUM_LIMITS : FREE_LIMITS;
}
