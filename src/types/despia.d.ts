// Global Despia native shell type declarations.
//
// The Despia native wrapper injects a global `despia(command)` function used to
// dispatch native bridge commands like `despia("takescreenshot://")`.
//
// On the web (outside the native shell) both are undefined.

export {};

declare global {
  /**
   * Despia native bridge function. Call with a URL-style command, e.g.
   * `despia("takescreenshot://")` to capture a screenshot to the device gallery.
   * Only defined inside the Despia native wrapper.
   */
  function despia(command: string): void;

  interface Window {
    __despiaAdCallbacksInstalled?: boolean;
    __despiaRewardedHandlerInstalled?: boolean;
    onDespiaNativeAdLoaded?: (payload?: unknown) => void;
    onDespiaNativeAdFailed?: (payload?: unknown) => void;
    /** Despia rewarded-ad completion callback. status is 'true' / 'false'. */
    updateRewardedStatus?: (status: string | boolean) => void;

    /** The Despia SDK may write URL-style bridge commands here internally. */
    despia?: unknown;
  }
}
