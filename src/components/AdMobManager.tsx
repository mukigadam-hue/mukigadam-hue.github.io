import { adLog, APP_ADS_DOMAIN, ADMOB_APP_ID, ADMOB_INTERSTITIAL_AD_UNIT_ID } from '@/lib/despiaAds';
import { initInterstitialAds } from '@/lib/interstitialAd';
import { useEffect } from 'react';

/**
 * AdMobManager — initializes the AdMob SDK at app launch and preloads the
 * first interstitial in the background so it's ready before the first trigger.
 *
 * Ad delivery itself is dual-trigger (see `src/lib/interstitialAd.ts`):
 *   A) close sales receipt → `triggerInterstitial`
 *   B) screen change       → `triggerInterstitialOnScreenChange` (45min gap)
 * Global cap: 2 ads per 90 minutes, with a 35-minute minimum spacing.
 */
export { adLog, APP_ADS_DOMAIN };

export default function AdMobManager() {
  useEffect(() => {
    adLog(`[AD-INFO] AdMob App ID: ${ADMOB_APP_ID}`);
    adLog(`[AD-INFO] app-ads.txt: ${APP_ADS_DOMAIN}/app-ads.txt`);
    adLog(`[AD-INFO] Interstitial Ad Unit: ${ADMOB_INTERSTITIAL_AD_UNIT_ID}`);
    adLog('[AD-INFO] Initializing AdMob SDK + preloading interstitial...');
    // Initialize SDK + preload first interstitial as soon as the app mounts.
    initInterstitialAds();
  }, []);
  return null;
}
