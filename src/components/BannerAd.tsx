import { useEffect, useState } from 'react';

declare global {
  interface Window {
    despia?: {
      AdMob?: {
        showBanner: (options: {
          adId: string;
          position?: 'top' | 'bottom';
          autoShow?: boolean;
        }) => Promise<void>;
        hideBanner: () => Promise<void>;
      };
    };
  }
}

const GOOGLE_TEST_AD_ID = 'ca-app-pub-3940256099942544/6300978111';

interface BannerAdProps {
  position?: 'top' | 'bottom';
  className?: string;
}

/**
 * Native AdMob banner via Despia SDK.
 * Only renders when running inside a native (Despia) shell.
 */
export default function BannerAd({ position = 'bottom', className }: BannerAdProps) {
  const [isNative, setIsNative] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only attempt to load if running inside Despia native shell
    if (!window.despia) {
      return;
    }

    setIsNative(true);

    const loadAd = async () => {
      try {
        if (window.despia?.AdMob) {
          await window.despia.AdMob.showBanner({
            adId: GOOGLE_TEST_AD_ID,
            position,
            autoShow: true,
          });
          setAdLoaded(true);
        }
      } catch (err: any) {
        console.warn('BannerAd: Failed to load AdMob banner', err);
        setError(err?.message || 'Ad failed to load');
      }
    };

    loadAd();

    // Cleanup: hide banner when component unmounts
    return () => {
      if (window.despia?.AdMob) {
        window.despia.AdMob.hideBanner().catch(() => {});
      }
    };
  }, [position]);

  // Don't render anything if not in a native environment
  if (!isNative) return null;

  // Reserve space for the native ad banner
  return (
    <div
      className={`w-full flex items-center justify-center ${className ?? ''}`}
      style={{ minHeight: adLoaded ? 50 : 0 }}
    >
      {error && (
        <p className="text-[10px] text-muted-foreground">{error}</p>
      )}
    </div>
  );
}
