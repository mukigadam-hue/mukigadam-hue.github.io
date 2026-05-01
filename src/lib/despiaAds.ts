import despia from 'despia-native';

/* -------------------------------------------------------------------------- */
/* IDs                                                                        */
/* -------------------------------------------------------------------------- */

export const ADMOB_APP_ID = 'ca-app-pub-9605564713228252~8941826330';
export const ADMOB_NATIVE_HOME_ID = 'ca-app-pub-9605564713228252/3146574176';
export const ADMOB_NATIVE_GENERAL_ID = 'ca-app-pub-9605564713228252/4713172172';
export const START_IO_APP_ID = '203959336';
export const APP_ADS_DOMAIN = 'https://mukigadam-hue.github.io';

type NativeAdPlacement =
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

/** Log helper: prints to browser console AND forwards to Despia native logs. */
export function adLog(message: string) {
  // eslint-disable-next-line no-console
  console.log(message);
  try {
    void despia(`log://?message=${encodeURIComponent(message)}` as any);
  } catch {
    /* native bridge not present (browser preview) */
  }
}

function adUnitForPlacement(placement: NativeAdPlacement) {
  return placement === 'home' || placement === 'inline'
    ? ADMOB_NATIVE_HOME_ID
    : ADMOB_NATIVE_GENERAL_ID;
}

/* -------------------------------------------------------------------------- */
/* Initialization                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Initialize the Despia native ad bridge.
 *
 * The web layer NEVER loads Google ad scripts. Despia handles AdMob /
 * Start.io natively. We only use Native Advanced (inline) ads — never
 * interstitials or rewarded.
 *
 * On startup we also verify the bridge by reading the device UUID.
 */
export async function initializeNativeAds() {
  adLog(`[AD-INFO] Initializing AdMob and Start.io (ID: ${START_IO_APP_ID})`);
  adLog(`[AD-INFO] app-ads.txt developer domain: ${APP_ADS_DOMAIN}/app-ads.txt`);

  // Verify the native bridge is connected (Despia documented check).
  try {
    const device = (await despia('get-uuid://' as any, ['uuid'])) as { uuid?: string };
    if (device?.uuid) {
      adLog(`[AD-INFO] Despia native bridge connected. Device UUID: ${device.uuid}`);
    } else {
      adLog('[AD-INFO] Despia bridge call returned no UUID (likely web preview).');
    }
  } catch {
    adLog('[AD-INFO] Despia bridge not available (web preview).');
  }
}

/* -------------------------------------------------------------------------- */
/* Native Advanced (inline) ads                                               */
/* -------------------------------------------------------------------------- */
/*
 * Inline Native Advanced ads ONLY. The web layer never loads Google ad URLs;
 * it just dispatches a Despia bridge command telling the native shell to
 * render a Native Advanced ad INTO a specific container DIV by id.
 *
 * No interstitials, no rewarded, no fullscreen — the ad must stay inside the
 * referenced container at the requested height.
 */

export function requestNativeAd(options: {
  containerId: string;
  placement: NativeAdPlacement;
  height: number;
}) {
  const adUnitId = adUnitForPlacement(options.placement);
  adLog(
    `[AD-STATUS] Requesting Native Advanced ad in #${options.containerId} (${options.placement}, ${options.height}px)`,
  );

  const params = new URLSearchParams({
    containerId: options.containerId,
    placement: options.placement,
    height: String(options.height),
    format: 'native_advanced',
    inline: 'true',
    fullscreen: 'false',
    provider: 'admob',
    fallback: 'startio',
    adUnitId,
    admobAppId: ADMOB_APP_ID,
    startioAppId: START_IO_APP_ID,
    appAdsTxt: `${APP_ADS_DOMAIN}/app-ads.txt`,
    // Suppress Despia's "Downloading file" toast and any system progress UI.
    silent: 'true',
    showToast: 'false',
    showProgress: 'false',
    showDownloadNotification: 'false',
    background: 'true',
  });

  try {
    void despia(`displaynativead://?${params.toString()}` as any);
  } catch {
    /* native bridge not present in browser preview */
  }
}

export function hideNativeAd(containerId: string) {
  try {
    void despia(`hidenativead://?containerId=${encodeURIComponent(containerId)}` as any);
  } catch {
    /* no-op on web */
  }
}
