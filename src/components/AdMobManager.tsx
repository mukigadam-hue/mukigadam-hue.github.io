import { useEffect } from 'react';
import { adLog, APP_ADS_DOMAIN, initializeNativeAds } from '@/lib/despiaAds';

/**
 * AdMobManager
 *
 * Initializes the Despia native bridge once on app mount.
 *
 * The web layer must not load Google ad scripts or DoubleClick URLs directly.
 * It only sends native bridge commands so the Despia wrapper can render ads.
 *
 * Real AdMob IDs used by this project:
 *   App ID:               ca-app-pub-9605564713228252~8941826330
 *   Banner unit:          ca-app-pub-9605564713228252/4713172172
 *   Native (home) unit:   ca-app-pub-9605564713228252/3146574176
 *   Native (general):     ca-app-pub-9605564713228252/4713172172
 */
/**
 * Official developer domain hosting the verified app-ads.txt file.
 * This is the domain registered in Google Play Console & AdMob and is what
 * crawlers fetch /app-ads.txt from — it must match regardless of the
 * preview / published Lovable URL.
 */
export { adLog, APP_ADS_DOMAIN };

export default function AdMobManager() {
  useEffect(() => {
    initializeNativeAds();
  }, []);

  return null;
}
