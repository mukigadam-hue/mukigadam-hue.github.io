import { adLog, APP_ADS_DOMAIN, ADMOB_APP_ID, ADMOB_INTERSTITIAL_AD_UNIT_ID } from '@/lib/despiaAds';
import { useEffect } from 'react';

/**
 * AdMobManager — startup logger for Despia's AdMob configuration.
 *
 * Native Advanced ads have been removed. The app now uses Despia
 * Interstitial ads (beta) triggered on screen changes from
 * `src/lib/interstitialAd.ts`.
 *
 * `app-ads.txt` is still served from {@link APP_ADS_DOMAIN} so the AdMob
 * app remains verified for crawlers.
 */
export { adLog, APP_ADS_DOMAIN };

export default function AdMobManager() {
  useEffect(() => {
    adLog(`[AD-INFO] AdMob App ID: ${ADMOB_APP_ID}`);
    adLog(`[AD-INFO] app-ads.txt: ${APP_ADS_DOMAIN}/app-ads.txt`);
    adLog(`[AD-INFO] Interstitial Ad Unit: ${ADMOB_INTERSTITIAL_AD_UNIT_ID}`);
    adLog('[AD-INFO] Ad format: Despia Interstitial (60-minute global cooldown).');
  }, []);
  return null;
}
