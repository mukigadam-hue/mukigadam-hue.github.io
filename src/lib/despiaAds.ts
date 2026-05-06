/* -------------------------------------------------------------------------- */
/* Despia / AdMob constants                                                   */
/* -------------------------------------------------------------------------- */
/**
 * Native Advanced ads are NOT supported by Despia. Despia currently offers
 * Reward ads and Interstitial ads (beta). This project uses Interstitial ads
 * via the Despia bridge: `despia("displayinterstitialad://")`.
 *
 * AdSense / inline `<ins class="adsbygoogle">` slots have been removed
 * permanently. We keep `app-ads.txt` reachable at the developer domain so the
 * AdMob app remains verified.
 */

export const ADMOB_APP_ID = 'ca-app-pub-9605564713228252~8941826330';
export const ADMOB_INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-9605564713228252/9382423774';
export const APP_ADS_DOMAIN = 'https://ndamwesigaapp.store';

export function adLog(message: string) {
  // eslint-disable-next-line no-console
  console.log(message);
}

export function isDespiaNativeShell(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes('despia') || ua.includes('biztrack') || ua.includes('com.despia.biztrack');
}
