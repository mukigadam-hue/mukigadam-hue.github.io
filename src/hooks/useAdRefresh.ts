/**
 * Deprecated. Native Advanced / inline AdSense slots are no longer rendered
 * (Despia does not support them). Kept as a no-op stub so legacy imports
 * continue to build.
 */
export function useAdRefresh(_slotId: string) {
  return { refreshKey: 0, onAdLoaded: () => {} };
}
