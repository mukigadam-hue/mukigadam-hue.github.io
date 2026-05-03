import despia from 'despia-native';

/* -------------------------------------------------------------------------- */
/* IDs                                                                        */
/* -------------------------------------------------------------------------- */

export const ADSENSE_PUBLISHER_ID = 'ca-pub-9605564713228252';
export const ADMOB_APP_ID = 'ca-app-pub-9605564713228252~8941826330';
// Native Advanced ad units (300x250 fixed). Re-used as AdSense slot ids.
export const ADMOB_NATIVE_HOME_SLOT = '3146574176';
export const ADMOB_NATIVE_GENERAL_SLOT = '4713172172';
export const APP_ADS_DOMAIN = 'https://mukigadam-hue.github.io';

export type AdPlacement =
  | 'banner'
  | 'inline'
  | 'compact'
  | 'home'
  | 'general'
  | 'top'
  | 'bottom';

/* -------------------------------------------------------------------------- */
/* Logging                                                                    */
/* -------------------------------------------------------------------------- */

export function adLog(message: string) {
  // eslint-disable-next-line no-console
  console.log(message);
  try {
    void despia(`log://?message=${encodeURIComponent(message)}` as any);
  } catch {
    /* not in native shell */
  }
}

export function adSlotForPlacement(placement: AdPlacement): string {
  return placement === 'home' || placement === 'inline'
    ? ADMOB_NATIVE_HOME_SLOT
    : ADMOB_NATIVE_GENERAL_SLOT;
}

/* -------------------------------------------------------------------------- */
/* Initialization                                                             */
/* -------------------------------------------------------------------------- */
/**
 * Despia's AdMob integration uses Google's WebView API for Ads. The native
 * shell registers the WebView with MobileAds.registerWebView() (Android) /
 * MobileAds.shared.register(webView) (iOS) automatically when AdMob is
 * enabled in the Despia dashboard. The web layer just needs to embed
 * standard AdSense `<ins class="adsbygoogle">` tags — Google will then
 * proxy the requests through the native AdMob SDK and they appear in the
 * AdMob console as real ad requests.
 *
 * There are NO custom URL-scheme bridge calls for ads (no
 * displaynativead://, no showad://). Any such calls were no-ops, which is
 * why AdMob previously reported "no ad requests yet".
 */
export async function initializeNativeAds() {
  adLog(`[AD-INFO] AdMob via WebView API for Ads. App ID: ${ADMOB_APP_ID}`);
  adLog(`[AD-INFO] AdSense client: ${ADSENSE_PUBLISHER_ID}`);
  adLog(`[AD-INFO] app-ads.txt: ${APP_ADS_DOMAIN}/app-ads.txt`);

  try {
    const device = (await despia('get-uuid://' as any, ['uuid'])) as { uuid?: string };
    if (device?.uuid) {
      adLog(`[AD-INFO] Despia native bridge connected. Device UUID: ${device.uuid}`);
    } else {
      adLog('[AD-INFO] No UUID returned (likely web preview).');
    }
  } catch {
    adLog('[AD-INFO] Despia bridge not available (web preview).');
  }
}

/* -------------------------------------------------------------------------- */
/* AdSense slot pusher                                                        */
/* -------------------------------------------------------------------------- */
/**
 * Push an AdSense slot into the queue. Safe to call multiple times — Google
 * deduplicates against the slot DOM node.
 */
export function pushAdsbygoogle() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    w.adsbygoogle = w.adsbygoogle || [];
    w.adsbygoogle.push({});
  } catch (e) {
    adLog(`[AD-WARN] adsbygoogle push failed: ${(e as Error)?.message ?? e}`);
  }
}
