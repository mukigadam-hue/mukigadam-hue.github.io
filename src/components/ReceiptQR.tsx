import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface Props {
  url: string;
  size?: number;
}

/** Renders a high-resolution QR code as an inline <img> so html2canvas captures it crisply for PDF/JPG export. */
export default function ReceiptQR({ url, size = 96 }: Props) {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, {
      width: 512,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then(d => { if (!cancelled) setSrc(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [url]);

  if (!src) return <div style={{ width: size, height: size }} className="bg-muted/30 rounded" />;
  return (
    <div className="flex flex-col items-center gap-1">
      <img
        src={src}
        alt="Receipt verification QR code"
        width={size}
        height={size}
        style={{ width: size, height: size, imageRendering: 'pixelated' }}
        crossOrigin="anonymous"
      />
      <p className="text-[9px] text-muted-foreground text-center leading-tight">
        Scan to verify authenticity
      </p>
    </div>
  );
}
