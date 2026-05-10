import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';

interface Item {
  item_name: string; category?: string; quality?: string;
  quantity: number; unit_price: number; subtotal: number; price_type?: string;
}
interface VerifyData {
  type: string;
  id: string;
  date: string;
  customer_name?: string;
  grand_total: number;
  amount_paid: number;
  balance: number;
  payment_status: string;
  recorded_by?: string;
  code?: string;
  items: Item[];
  business: {
    name: string; logo_url?: string; contact: string;
    address: string; email: string; business_code?: string;
    currency_symbol: string;
  };
}

export default function VerifyReceiptPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [data, setData] = useState<VerifyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    (async () => {
      if (!type || !id) { setError('Missing parameters'); setLoading(false); return; }
      const { data: row, error: e } = await supabase.rpc('verify_receipt' as any, { _type: type, _id: id });
      if (e || !row) { setError('Receipt not found or has been removed.'); setLoading(false); return; }
      setData(row as any);
      setLoading(false);
    })();
  }, [type, id]);

  const fmt = (n: number) => `${data?.business.currency_symbol || ''} ${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-3">
            <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-xl font-bold">Receipt Not Found</h1>
            <p className="text-sm text-muted-foreground">{error || 'This receipt could not be verified.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPaid = data.payment_status === 'paid' || data.balance <= 0;
  const typeLabel = data.type.charAt(0).toUpperCase() + data.type.slice(1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-6 px-3">
      <div className="max-w-md mx-auto space-y-3">
        <Card className="shadow-card">
          <CardContent className="p-4 space-y-3">
            {/* Authentic badge */}
            <div className="flex items-center justify-center gap-2 bg-success/10 text-success border border-success/30 rounded-lg py-3 font-bold">
              <ShieldCheck className="h-5 w-5" />
              Authentic Receipt
            </div>

            {/* Business header */}
            <div className="text-center space-y-1">
              {data.business.logo_url && (
                <img src={data.business.logo_url} alt={data.business.name}
                  className="h-16 w-16 mx-auto rounded-full object-cover border" />
              )}
              <h1 className="text-lg font-bold">{data.business.name}</h1>
              {data.business.address && <p className="text-xs text-muted-foreground">{data.business.address}</p>}
              <p className="text-xs text-muted-foreground">
                {data.business.contact}{data.business.email ? ` · ${data.business.email}` : ''}
              </p>
              {data.business.business_code && (
                <p className="text-[10px] text-muted-foreground">Business Code: <span className="font-mono font-semibold text-foreground">{data.business.business_code}</span></p>
              )}
            </div>

            <Separator />

            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Type:</span><span className="font-semibold">{typeLabel}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Invoice ID:</span><span className="font-mono text-xs">{(data.code || data.id).slice(0, 16)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date:</span><span>{new Date(data.date).toLocaleString()}</span></div>
              {data.customer_name && (
                <div className="flex justify-between"><span className="text-muted-foreground">Buyer:</span><span className="font-semibold">{data.customer_name}</span></div>
              )}
              {data.recorded_by && (
                <div className="flex justify-between"><span className="text-muted-foreground">Recorded by:</span><span>{data.recorded_by}</span></div>
              )}
            </div>

            <Separator />

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">Items</p>
              {data.items.map((it, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{it.item_name} × {it.quantity}</span>
                  <span className="tabular-nums">{fmt(Number(it.subtotal))}</span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="tabular-nums">{fmt(Number(data.grand_total))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-success">Amount Paid</span>
              <span className="font-semibold text-success tabular-nums">{fmt(Number(data.amount_paid))}</span>
            </div>
            <div className={`flex justify-between text-sm font-bold ${isPaid ? 'text-success' : 'text-warning'}`}>
              <span>Balance Due</span>
              <span className="tabular-nums">{fmt(Number(data.balance))}</span>
            </div>

            <div className={`text-center py-2 rounded-md text-xs font-bold ${isPaid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
              {isPaid ? '✅ FULLY PAID' : data.payment_status === 'partial' ? '⚠ PARTIALLY PAID' : '⚠ UNPAID'}
            </div>

            <p className="text-center text-[10px] text-muted-foreground pt-2">
              This is a public verification page for proof of authenticity.
            </p>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">
          <Link to="/" className="underline">Back to app</Link>
        </p>
      </div>
    </div>
  );
}
