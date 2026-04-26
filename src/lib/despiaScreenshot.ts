/**
 * Despia native shell screenshot helper.
 *
 * Despia exposes a global `despia()` function (separate from `window.despia.AdMob`)
 * that the native iOS/Android shell intercepts. Calling `despia("takescreenshot://")`
 * triggers the native screenshot capture, saving the image to the device's gallery.
 *
 * On the web (outside the Despia shell) this gracefully falls back to a no-op
 * and returns `false` so callers can offer an alternative or hide the button.
 */

/** True if running inside the Despia native shell (the bridge function exists). */
export function isDespiaShell(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).despia === 'function';
}

/**
 * Trigger a native screenshot via the Despia bridge.
 * Returns `true` if the native command was dispatched, `false` otherwise.
 */
export function takeNativeScreenshot(): boolean {
  try {
    const fn = (window as any).despia;
    if (typeof fn === 'function') {
      fn('takescreenshot://');
      return true;
    }
  } catch (err) {
    console.warn('[Despia] screenshot bridge failed:', err);
  }
  return false;
}
