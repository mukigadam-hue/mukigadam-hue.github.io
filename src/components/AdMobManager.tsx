import { useEffect } from 'react';
import despia from 'despia-native';

/**
 * AdMobManager
 *
 * Initializes the Despia native bridge once on app mount and pre-warms the
 * Google ad tag queue used by Despia's WebView API for Ads pipeline.
 *
 * Despia's inline AdMob support is activated in the native wrapper after the
 * app is rebuilt with AdMob enabled. The web layer should only initialize the
 * bridge and render standard Google ad tags when slots become visible.
 *
 * Real AdMob IDs used by this project:
 *   App ID:               ca-app-pub-9605564713228252~8941826330
 *   Banner unit:          ca-app-pub-9605564713228252/4713172172
 *   Native (home) unit:   ca-app-pub-9605564713228252/3146574176
 *   Native (general):     ca-app-pub-9605564713228252/4713172172
 */
/** Log helper: prints to browser console AND forwards to Despia native bridge. */
export function adLog(message: string) {
  // eslint-disable-next-line no-console
  console.log(message);
  try {
    // Forward to native shell so the message also appears in device logs.
    despia(`log://?message=${encodeURIComponent(message)}`);
  } catch {
    /* native bridge not present (web) */
  }
}

/**
 * Official developer domain hosting the verified app-ads.txt file.
 * This is the domain registered in Google Play Console & AdMob and is what
 * crawlers fetch /app-ads.txt from — it must match regardless of the
 * preview / published Lovable URL.
 */
export const APP_ADS_DOMAIN = 'https://mukigadam-hue.github.io';

export default function AdMobManager() {
  useEffect(() => {
    adLog('[AD-INFO] Initializing AdMob and Start.io (ID: 203959336)');
    adLog(`[AD-INFO] app-ads.txt developer domain: ${APP_ADS_DOMAIN}/app-ads.txt`);
    // 1. Native shell: wake the AdMob pipeline immediately on app startup.
    try {
      despia('initializeAds://');
      despia('admobappid://?id=ca-app-pub-9605564713228252~8941826330');
      // Tell the Despia native bridge which domain hosts the verified
      // app-ads.txt so AdMob/Start.io crawlers resolve to the GitHub Pages
      // developer domain rather than the Lovable preview/published URL.
      despia(`appadsdomain://?url=${encodeURIComponent(APP_ADS_DOMAIN + '/app-ads.txt')}`);
      despia(`developerdomain://?url=${encodeURIComponent(APP_ADS_DOMAIN)}`);
      // Start.io fallback provider — App ID only (no API key required).
      despia('startioappid://?id=203959336');
      despia('initializeStartio://?appid=203959336');
      despia(`startioappadsdomain://?url=${encodeURIComponent(APP_ADS_DOMAIN + '/app-ads.txt')}`);
    } catch {
      /* no-op: native bridge not present */
    }

    // 2. Web / WebView for Ads: ensure the queue exists before slots mount.
    try {
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
    } catch {
      /* ignore */
    }
  }, []);

  return null;
}
