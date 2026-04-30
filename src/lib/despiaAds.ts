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
  dispatchDespiaCommand(`log://?message=${encodeURIComponent(message)}`, false);
}

function isLikelyDespiaRuntime() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.includes('despia') ||
    Boolean((window as any).ReactNativeWebView) ||
    Boolean((window as any).webkit?.messageHandlers?.despia)
  );
}

function dispatchDespiaCommand(command: string, allowLocationBridge = true) {
  try {
    void despia(command);
  } catch {
    /* native bridge not present */
  }

  // Some Despia native builds listen for URL-scheme navigation instead of only
  // the SDK setter. Gate it so the browser preview never navigates away.
  if (allowLocationBridge && command.startsWith('despia://') && isLikelyDespiaRuntime()) {
    window.location.href = command;
  }
}

function adUnitForPlacement(placement: NativeAdPlacement) {
  return placement === 'home' || placement === 'inline'
    ? ADMOB_NATIVE_HOME_ID
    : ADMOB_NATIVE_GENERAL_ID;
}

export function initializeNativeAds() {
  installNativeAdCallbacks();
  adLog(`[AD-INFO] Initializing AdMob and Start.io (ID: ${START_IO_APP_ID})`);
  adLog(`[AD-INFO] app-ads.txt developer domain: ${APP_ADS_DOMAIN}/app-ads.txt`);

  const params = new URLSearchParams({
    admobAppId: ADMOB_APP_ID,
    startioAppId: START_IO_APP_ID,
    appAdsTxt: `${APP_ADS_DOMAIN}/app-ads.txt`,
    developerDomain: APP_ADS_DOMAIN,
  });

  dispatchDespiaCommand(`despia://initializeAds?${params.toString()}`);
  dispatchDespiaCommand(`admobappid://?id=${encodeURIComponent(ADMOB_APP_ID)}`, false);
  dispatchDespiaCommand(`startioappid://?id=${encodeURIComponent(START_IO_APP_ID)}`, false);
  dispatchDespiaCommand(`appadsdomain://?url=${encodeURIComponent(`${APP_ADS_DOMAIN}/app-ads.txt`)}`, false);
  dispatchDespiaCommand(`developerdomain://?url=${encodeURIComponent(APP_ADS_DOMAIN)}`, false);
  dispatchDespiaCommand(`startioappadsdomain://?url=${encodeURIComponent(`${APP_ADS_DOMAIN}/app-ads.txt`)}`, false);
}

export function requestNativeAd(options: {
  containerId: string;
  placement: NativeAdPlacement;
  height: number;
}) {
  const adUnitId = adUnitForPlacement(options.placement);
  adLog('[AD-STATUS] Requesting AdMob Native Ad...');

  const params = new URLSearchParams({
    containerId: options.containerId,
    placement: options.placement,
    height: String(options.height),
    provider: 'admob',
    fallback: 'startio',
    adUnitId,
    admobAppId: ADMOB_APP_ID,
    startioAppId: START_IO_APP_ID,
    appAdsTxt: `${APP_ADS_DOMAIN}/app-ads.txt`,
  });

  dispatchDespiaCommand(`despia://showNativeAd?${params.toString()}`);
}

export function hideNativeAd(containerId: string) {
  dispatchDespiaCommand(`despia://hideNativeAd?containerId=${encodeURIComponent(containerId)}`);
}

function normaliseAdEvent(payload: unknown) {
  if (payload && typeof payload === 'object') return payload as Record<string, unknown>;
  return { message: payload };
}

function installNativeAdCallbacks() {
  if (typeof window === 'undefined') return;
  const nativeWindow = window as Window & Record<string, any>;
  if (nativeWindow.__despiaAdCallbacksInstalled) return;
  nativeWindow.__despiaAdCallbacksInstalled = true;

  nativeWindow.onDespiaNativeAdLoaded = (payload?: unknown) => {
    const event = normaliseAdEvent(payload);
    const provider = String(event.provider || 'AdMob');
    adLog(`[AD-SUCCESS] ${provider} ad loaded`);
  };

  nativeWindow.onDespiaNativeAdFailed = (payload?: unknown) => {
    const event = normaliseAdEvent(payload);
    const provider = String(event.provider || 'AdMob');
    const code = String(event.code || event.errorCode || 'N/A');
    const reason = String(event.reason || event.message || 'unknown');

    if (provider.toLowerCase().includes('admob')) {
      adLog('[AD-RETRY] AdMob failed. Switching to Start.io fallback...');
      adLog(`[AD-ERROR] AdMob error code: ${code} — ${reason}`);
      adLog('[AD-STATUS] Requesting Start.io Native Ad...');
      return;
    }

    adLog(`[AD-FAIL] ${provider} failed — reason: ${reason}`);
  };

  window.addEventListener('despiaNativeAdLoaded', ((event: CustomEvent) => {
    nativeWindow.onDespiaNativeAdLoaded?.(event.detail);
  }) as EventListener);

  window.addEventListener('despiaNativeAdFailed', ((event: CustomEvent) => {
    nativeWindow.onDespiaNativeAdFailed?.(event.detail);
  }) as EventListener);
}