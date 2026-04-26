// Global Despia native shell + AdMob bridge types.
// The Despia shell injects `window.despia.AdMob` at runtime when the app
// runs inside the native wrapper. On web these are undefined.

export {};

declare global {
  /**
   * Despia native shell global bridge function.
   * Called as `despia("takescreenshot://")`, `despia("vibrate://")`, etc.
   * Only defined when running inside the native Despia wrapper.
   */
  function despia(command: string): void;

  interface Window {
    /**
     * Despia native bridge function (also exposed on window).
     * When this is a function, the app is running inside the native shell.
     * When it's an object (legacy), the AdMob bridge is exposed under `.AdMob`.
     */
    despia?: ((command: string) => void) | {
      AdMob?: {
        showBanner: (options: {
          adId: string;
          position?: 'top' | 'bottom';
          autoShow?: boolean;
        }) => Promise<void>;
        hideBanner: () => Promise<void>;
        showNative?: (options: {
          adId: string;
          containerId?: string;
        }) => Promise<void>;
        hideNative?: (containerId?: string) => Promise<void>;
      };
    };
  }
}
