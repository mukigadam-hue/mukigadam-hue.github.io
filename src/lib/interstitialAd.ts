import { adLog, isDespiaNativeShell } from './despiaAds';

/**
 * Global Interstitial Ad Manager.
 *
 * Despia exposes interstitial ads via the native bridge call
 *   despia("displayinterstitialad://")
 *
 * Rules:
 *  - Show at most one interstitial per `MIN_INTERVAL_MS` (60 minutes).
 *  - Triggered on app navigation (route changes, back/close buttons).
 *  - Can be suppressed for the very next route change via
 *    `suppressNextInterstitial()` — used right after a sale to ensure the
 *    receipt that opens immediately after the sale is never interrupted.
 */

const STORAGE_KEY = 'lastInterstitialShownAt';
const SUPPRESS_KEY = 'suppressNextInterstitial';
const MIN_INTERVAL_MS = 60 * 60 * 1000; // 60 minutes

function readNumber(key: string): number {
  try {
    const raw = localStorage.getItem(key);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

function writeNumber(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {}
}

function clearKey(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

/** Suppress the next call to `maybeShowInterstitial()` (one-shot). */
export function suppressNextInterstitial() {
  writeNumber(SUPPRESS_KEY, 1);
}

function consumeSuppression(): boolean {
  const v = readNumber(SUPPRESS_KEY);
  if (v) {
    clearKey(SUPPRESS_KEY);
    return true;
  }
  return false;
}

/**
 * Call when the user navigates between screens. If 60 minutes have passed
 * since the last interstitial, requests the Despia bridge to display one
 * and resets the timer. Otherwise no-op.
 */
export function maybeShowInterstitial(reason = 'navigation') {
  if (typeof window === 'undefined') return;

  if (consumeSuppression()) {
    adLog(`[AD-INTERSTITIAL] Suppressed (post-sale receipt). reason=${reason}`);
    return;
  }

  const last = readNumber(STORAGE_KEY);
  const now = Date.now();
  if (last && now - last < MIN_INTERVAL_MS) {
    return;
  }

  if (!isDespiaNativeShell()) {
    // Outside the native shell the bridge does not exist — only update timer
    // in dev to avoid spamming logs.
    adLog(`[AD-INTERSTITIAL] Skipped (not in Despia shell). reason=${reason}`);
    writeNumber(STORAGE_KEY, now);
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = (window as any).despia as ((cmd: string) => void) | undefined;
    if (typeof fn === 'function') {
      fn('displayinterstitialad://');
      writeNumber(STORAGE_KEY, now);
      adLog(`[AD-INTERSTITIAL] Requested displayinterstitialad:// reason=${reason}`);
    } else {
      adLog('[AD-INTERSTITIAL] Despia bridge function not available.');
    }
  } catch (e) {
    adLog(`[AD-INTERSTITIAL] Bridge call failed: ${(e as Error)?.message ?? e}`);
  }
}
