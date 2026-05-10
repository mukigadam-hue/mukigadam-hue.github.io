import { adLog, isDespiaNativeShell } from './despiaAds';

/**
 * Despia Interstitial Ad Manager — dual-trigger logic.
 *
 * Goals:
 *   - Maximize ad fill speed by initializing AdMob SDK at app launch and
 *     preloading the next interstitial in the background.
 *   - Show at most 2 interstitials per 90 minutes across the whole app.
 *   - Enforce at least a 35-minute gap between any two ads.
 *
 * Two triggers:
 *   A) "Worker" — fired explicitly when the user closes a sales receipt
 *      (or any natural completion point). Call `triggerInterstitial(reason)`.
 *   B) "Browser" — fired automatically when the user switches between main
 *      screens, but only if the last ad was 45+ minutes ago. Wired up via
 *      `useScreenChangeInterstitial()`.
 *
 * Despia bridges used:
 *   - `displayinterstitialad://`  — show the preloaded interstitial
 *   - `preloadinterstitialad://`  — preload the next interstitial
 *
 * State persisted in localStorage so caps survive app restarts:
 *   - lastAdTime          number   ms epoch of most recent shown ad
 *   - adShownTimes        number[] ms epoch list, trimmed to last 90 minutes
 *   - suppressNextInterstitial  one-shot flag (post-sale receipt exemption)
 */

const LAST_AD_KEY = 'lastAdTime';
const SHOWN_TIMES_KEY = 'adShownTimes';
const SUPPRESS_KEY = 'suppressNextInterstitial';

const WINDOW_MS = 90 * 60 * 1000;          // 90 minutes
const MAX_PER_WINDOW = 2;                  // 2 ads per window
const MIN_GAP_MS = 35 * 60 * 1000;         // 35 minutes between ads
const SCREEN_CHANGE_GAP_MS = 45 * 60 * 1000; // 45 min for Trigger B

/* ----------------------------- storage helpers ---------------------------- */
function readNumber(key: string): number {
  try { const r = localStorage.getItem(key); return r ? Number(r) || 0 : 0; } catch { return 0; }
}
function writeNumber(key: string, value: number) {
  try { localStorage.setItem(key, String(value)); } catch {}
}
function clearKey(key: string) { try { localStorage.removeItem(key); } catch {} }

function readShownTimes(): number[] {
  try {
    const raw = localStorage.getItem(SHOWN_TIMES_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((n) => typeof n === 'number') : [];
  } catch { return []; }
}
function writeShownTimes(times: number[]) {
  try { localStorage.setItem(SHOWN_TIMES_KEY, JSON.stringify(times)); } catch {}
}
function pruneAndRecordShown(now: number) {
  const kept = readShownTimes().filter((t) => now - t < WINDOW_MS);
  kept.push(now);
  writeShownTimes(kept);
  writeNumber(LAST_AD_KEY, now);
}

/* ------------------------------ suppression ------------------------------- */
export function suppressNextInterstitial() { writeNumber(SUPPRESS_KEY, 1); }
function consumeSuppression(): boolean {
  if (readNumber(SUPPRESS_KEY)) { clearKey(SUPPRESS_KEY); return true; }
  return false;
}

/* --------------------------- ad-loaded tracking --------------------------- */
let adLoaded = false; // best-effort flag; flipped by Despia callbacks if available

function fireDespia(cmd: string) {
  if (typeof window === 'undefined') return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = (window as any).despia as ((c: string) => void) | undefined;
    if (typeof fn === 'function') { fn(cmd); return true; }
    // Fallback: URL-scheme dispatch (Despia docs recommended pattern).
    window.location.href = cmd;
    return true;
  } catch (e) {
    adLog(`[AD-INTERSTITIAL] Bridge call failed (${cmd}): ${(e as Error)?.message ?? e}`);
    return false;
  }
}

function preloadInterstitial() {
  if (!isDespiaNativeShell()) return;
  fireDespia('preloadinterstitialad://');
  adLog('[AD-INTERSTITIAL] Preload requested.');
}

/**
 * Initialize the AdMob SDK and preload the first interstitial.
 * Safe to call multiple times — idempotent.
 */
let initialized = false;
export function initInterstitialAds() {
  if (initialized) return;
  initialized = true;
  if (!isDespiaNativeShell()) {
    adLog('[AD-INTERSTITIAL] Init skipped (not in Despia shell).');
    return;
  }

  // Wire up optional Despia callbacks if the shell exposes them.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    w.onDespiaInterstitialLoaded = () => { adLoaded = true; adLog('[AD-INTERSTITIAL] Loaded.'); };
    w.onDespiaInterstitialFailed = () => { adLoaded = false; adLog('[AD-INTERSTITIAL] Failed to load — will retry.'); setTimeout(preloadInterstitial, 5000); };
    w.onDespiaInterstitialDismissed = () => { adLoaded = false; adLog('[AD-INTERSTITIAL] Dismissed — preloading next.'); preloadInterstitial(); };
  } catch {}

  // Initialize SDK then preload.
  fireDespia('admob_initialize://');
  // Some Despia builds auto-init on first interstitial call; preload anyway.
  preloadInterstitial();
  // Optimistically assume an ad becomes available shortly.
  setTimeout(() => { adLoaded = true; }, 4000);
}

/* ---------------------------- gating predicate ---------------------------- */
function canShowAd(now: number, minGapMs: number): { ok: boolean; reason?: string } {
  const last = readNumber(LAST_AD_KEY);
  if (last && now - last < minGapMs) {
    return { ok: false, reason: `gap (${Math.round((now - last) / 60000)}min < ${Math.round(minGapMs / 60000)}min)` };
  }
  const shown = readShownTimes().filter((t) => now - t < WINDOW_MS);
  if (shown.length >= MAX_PER_WINDOW) {
    return { ok: false, reason: `cap (${shown.length}/${MAX_PER_WINDOW} in 90min)` };
  }
  return { ok: true };
}

function showNow(reason: string) {
  if (!isDespiaNativeShell()) {
    adLog(`[AD-INTERSTITIAL] Skipped (not in Despia shell). reason=${reason}`);
    return;
  }
  if (!adLoaded) {
    adLog(`[AD-INTERSTITIAL] No ad ready — preloading. reason=${reason}`);
    preloadInterstitial();
    return;
  }
  const now = Date.now();
  fireDespia('displayinterstitialad://');
  pruneAndRecordShown(now);
  adLoaded = false;
  adLog(`[AD-INTERSTITIAL] Shown. reason=${reason}`);
  // Auto-reload next ad immediately so it's ready for the next trigger.
  setTimeout(preloadInterstitial, 800);
}

/* ----------------------------- public triggers ---------------------------- */

/** Trigger A — explicit completion point (e.g. close sales receipt). */
export function triggerInterstitial(reason: string) {
  if (typeof window === 'undefined') return;
  if (consumeSuppression()) {
    adLog(`[AD-INTERSTITIAL] Suppressed (one-shot). reason=${reason}`);
    return;
  }
  const now = Date.now();
  const gate = canShowAd(now, MIN_GAP_MS);
  if (!gate.ok) {
    adLog(`[AD-INTERSTITIAL] Trigger A blocked: ${gate.reason}. reason=${reason}`);
    return;
  }
  showNow(`A:${reason}`);
}

/** Trigger B — screen change (45-min minimum gap on top of global rules). */
export function triggerInterstitialOnScreenChange(reason: string) {
  if (typeof window === 'undefined') return;
  if (consumeSuppression()) return;
  const now = Date.now();
  const gate = canShowAd(now, Math.max(MIN_GAP_MS, SCREEN_CHANGE_GAP_MS));
  if (!gate.ok) {
    adLog(`[AD-INTERSTITIAL] Trigger B blocked: ${gate.reason}. reason=${reason}`);
    return;
  }
  showNow(`B:${reason}`);
}

/** @deprecated Kept for backwards compatibility — no-op. */
export function maybeShowInterstitial(_reason = 'navigation') { /* no-op */ }
