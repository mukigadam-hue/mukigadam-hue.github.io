import despia from 'despia-native';

export const ADMOB_APP_ID = 'ca-app-pub-9605564713228252~8941826330';
export const ADMOB_NATIVE_HOME_ID = 'ca-app-pub-9605564713228252/3146574176';
export const ADMOB_NATIVE_GENERAL_ID = 'ca-app-pub-9605564713228252/4713172172';
export const START_IO_APP_ID = '203959336';
export const APP_ADS_DOMAIN = 'https://mukigadam-hue.github.io';

type NativeAdPlacement = 'banner' | 'inline' | 'compact' | 'home' | 'general' | 'top' | 'bottom';

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

/** Last reward callback registered by `requestRewardedAd`. */
let pendingRewardCallback: ((granted: boolean) => void) | null = null;

function installRewardedHandler() {
  if (typeof window === 'undefined') return;
  const w = window as Window & Record<string, any>;
  if (w.__despiaRewardedHandlerInstalled) return;
  w.__despiaRewardedHandlerInstalled = true;

  // Despia calls this global when the rewarded ad finishes.
  w.updateRewardedStatus = (status: string | boolean) => {
    const granted = status === true || status === 'true';
    adLog(`[AD-STATUS] updateRewardedStatus -> ${String(status)}`);
    if (granted) {
      adLog('[AD-SUCCESS] Rewarded ad completed — granting reward');
    } else {
      adLog('[AD-FAIL] Rewarded ad not completed');
    }
    if (pendingRewardCallback) {
      const cb = pendingRewardCallback;
      pendingRewardCallback = null;
      try { cb(granted); } catch (err) { console.error(err); }
    }
  };
}

/**
 * Initialize the Despia native ad bridge.
 *
 * Per Despia support, the web layer should NOT load Google ad scripts.
 * Instead, ads are triggered via native protocol commands (e.g.
 * `displayrewardedad://`) and Despia handles AdMob / Start.io natively.
 *
 * On startup we also verify the bridge by reading the device UUID.
 */
export async function initializeNativeAds() {
  installRewardedHandler();

  adLog(`[AD-INFO] Initializing AdMob and Start.io (ID: ${START_IO_APP_ID})`);
  adLog(`[AD-INFO] app-ads.txt developer domain: ${APP_ADS_DOMAIN}/app-ads.txt`);

  // Verify the native bridge is connected (Despia documented check).
  try {
    const device = await despia('get-uuid://' as any, ['uuid']) as { uuid?: string };
    if (device?.uuid) {
      adLog(`[AD-INFO] Despia native bridge connected. Device UUID: ${device.uuid}`);
    } else {
      adLog('[AD-INFO] Despia bridge call returned no UUID (likely web preview).');
    }
  } catch {
    adLog('[AD-INFO] Despia bridge not available (web preview).');
  }
}

/**
 * Trigger the native rewarded ad. Resolves with `true` if the user earned
 * the reward, `false` otherwise. Safe to call from any component.
 */
export function requestRewardedAd(): Promise<boolean> {
  installRewardedHandler();
  adLog('[AD-STATUS] Requesting rewarded ad via despia://displayrewardedad');

  return new Promise<boolean>((resolve) => {
    pendingRewardCallback = resolve;
    try {
      void despia('displayrewardedad://' as any);
    } catch (err) {
      adLog(`[AD-FAIL] Failed to dispatch rewarded ad: ${(err as Error)?.message ?? err}`);
      pendingRewardCallback = null;
      resolve(false);
    }

    // Safety timeout: if Despia never calls back (e.g. web preview), resolve
    // with `false` after 30s so callers don't hang forever.
    setTimeout(() => {
      if (pendingRewardCallback === resolve) {
        pendingRewardCallback = null;
        adLog('[AD-FAIL] Rewarded ad timed out (no native callback)');
        resolve(false);
      }
    }, 30_000);
  });
}

/* -------------------------------------------------------------------------- */
/* Native ad placeholders                                                     */
/* -------------------------------------------------------------------------- */
/*
 * The web app NEVER loads Google ad URLs. We just leave empty placeholder
 * containers in the DOM and let the Despia wrapper inject native ads on top
 * of them. These helpers exist so banner / native ad components have a
 * consistent (no-op on the web) integration point.
 */

export function requestNativeAd(_options: {
  containerId: string;
  placement: NativeAdPlacement;
  height: number;
}) {
  // No-op on the web. Despia native shell observes `[data-despia-native-ad]`
  // elements and renders ads over them.
}

export function hideNativeAd(_containerId: string) {
  // No-op on the web — placeholder cleanup happens via React unmount.
}
