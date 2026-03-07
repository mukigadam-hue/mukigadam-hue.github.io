import { useState, useEffect } from 'react';
import { useBusiness } from '@/context/BusinessContext';
import { useCurrency } from '@/hooks/useCurrency';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Eye, ShieldCheck, Clock, Smartphone, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface PendingOrder {
  id: string;
  customer_name: string;
  grand_total: number;
  status: string;
  code: string;
  payment_method: string;
  proof_url: string | null;
  created_at: string;
}

export default function PaymentVerificationPage() {
  const { currentBusiness, userRole } = useBusiness();
  const { fmt } = useCurrency();
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingProof, setViewingProof] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'paid' | 'all'>('pending');

  const isAdmin = userRole === 'owner' || userRole === 'admin';

  useEffect(() => {
    if (currentBusiness) loadOrders();
  }, [currentBusiness, filter]);

  async function loadOrders() {
    if (!currentBusiness) return;
    setLoading(true);
    let query = supabase
      .from('orders')
      .select('*')
      .eq('business_id', currentBusiness.id)
      .eq('type', 'checkout')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    setOrders((data || []) as PendingOrder[]);
    setLoading(false);
  }

  async function updateStatus(orderId: string, status: 'paid' | 'cancelled') {
    const { error } = await supabase.from('orders').update({ status } as any).eq('id', orderId);
    if (error) { toast.error(error.message); return; }
    toast.success(status === 'paid' ? 'Payment verified ✓' : 'Order cancelled');
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="h-6 w-6" /> Payment Verification</h1>
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          Only business owners and admins can verify payments.
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <ShieldCheck className="h-6 w-6" /> Payment Verification
      </h1>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['pending', 'paid', 'all'] as const).map(f => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>
            {f === 'pending' && <Clock className="h-3.5 w-3.5 mr-1" />}
            {f === 'paid' && <CheckCircle className="h-3.5 w-3.5 mr-1" />}
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && ` (${orders.filter(o => o.status === 'pending').length})`}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : orders.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No {filter} orders found.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {orders.map(order => (
            <Card key={order.id} className="shadow-card">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">👤 {order.customer_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        order.status === 'paid' ? 'bg-success/10 text-success' :
                        order.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                        'bg-warning/10 text-warning'
                      }`}>{order.status}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        {order.payment_method === 'mobile_money' ? <Smartphone className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                        {order.payment_method === 'mobile_money' ? 'M-Money' : 'Card'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Code: <span className="font-mono">{order.code}</span> · {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-success tabular-nums">{fmt(Number(order.grand_total))}</span>

                    {order.proof_url && (
                      <Button size="sm" variant="outline" onClick={() => setViewingProof(order.proof_url)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> Proof
                      </Button>
                    )}

                    {order.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => updateStatus(order.id, 'paid')} className="bg-success hover:bg-success/90 text-success-foreground">
                          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Verify
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(order.id, 'cancelled')}>
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Proof viewer */}
      <Dialog open={!!viewingProof} onOpenChange={o => { if (!o) setViewingProof(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Payment Proof</DialogTitle></DialogHeader>
          {viewingProof && (
            <img src={viewingProof} alt="Payment proof" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
