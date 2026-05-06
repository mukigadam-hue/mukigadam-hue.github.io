import { adLog, isDespiaNativeShell } from './despiaAds';

/**
 * Global Interstitial Ad Manager.
 *
 * Per AdMob policy, interstitials are only triggered at NATURAL COMPLETION
 * POINTS — never on general navigation. Call sites:
 *   - When user closes a Sale / Purchase / Service receipt (back to list)
 *   - When user successfully submits a new business record / form
 *   - When user exports a report or document (Save/Share PDF/Image, Print)
 *
 * Despia bridge:  despia("admob://interstitial")
 * Cooldown:       60 minutes between shown ads (any trigger source).
 *
 * Exception: the receipt that opens IMMEDIATELY after a sale must remain
 * ad-free. Sale flows call `suppressNextInterstitial()` so the next trigger
 * (i.e. the close-receipt handler) is skipped exactly once.
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
  try { localStorage.setItem(key, String(value)); } catch {}
}
function clearKey(key: string) {
  try { localStorage.removeItem(key); } catch {}
}

/** Suppress the next trigger (one-shot). Used for the post-sale receipt. */
export function suppressNextInterstitial() {
  writeNumber(SUPPRESS_KEY, 1);
}
function consumeSuppression(): boolean {
  if (readNumber(SUPPRESS_KEY)) { clearKey(SUPPRESS_KEY); return true; }
  return false;
}

/**
 * Trigger an interstitial at a natural completion point. Respects the
 * 60-minute cooldown and one-shot suppression.
 */
export function triggerInterstitial(reason: string) {
  if (typeof window === 'undefined') return;

  if (consumeSuppression()) {
    adLog(`[AD-INTERSTITIAL] Suppressed (post-sale). reason=${reason}`);
    return;
  }

  const last = readNumber(STORAGE_KEY);
  const now = Date.now();
  if (last && now - last < MIN_INTERVAL_MS) {
    adLog(`[AD-INTERSTITIAL] Cooldown active. reason=${reason}`);
    return;
  }

  if (!isDespiaNativeShell()) {
    adLog(`[AD-INTERSTITIAL] Skipped (not in Despia shell). reason=${reason}`);
    writeNumber(STORAGE_KEY, now);
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = (window as any).despia as ((cmd: string) => void) | undefined;
    if (typeof fn === 'function') {
      // Per Despia docs: https://setup.despia.com/native-features/admob/Iinterstitial
      fn('admob://interstitial');
      writeNumber(STORAGE_KEY, now);
      adLog(`[AD-INTERSTITIAL] Requested admob://interstitial reason=${reason}`);
    } else {
      adLog('[AD-INTERSTITIAL] Despia bridge not available.');
    }
  } catch (e) {
    adLog(`[AD-INTERSTITIAL] Bridge call failed: ${(e as Error)?.message ?? e}`);
  }
}

/** @deprecated Kept as a no-op so older imports do not break. */
export function maybeShowInterstitial(_reason = 'navigation') {
  // Intentionally no-op: navigation-based triggers were removed for AdMob policy compliance.
}

