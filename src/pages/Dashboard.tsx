import { useBusiness } from '@/context/BusinessContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, AlertTriangle, XCircle, DollarSign, ShoppingCart } from 'lucide-react';

export default function Dashboard() {
  const { currentBusiness, stock, sales } = useBusiness();

  const todaySales = sales.filter(s => {
    const d = new Date(s.created_at);
    return d.toDateString() === new Date().toDateString();
  });
  const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.grand_total), 0);

  const lowStock = stock.filter(item => item.quantity > 0 && item.quantity <= item.min_stock_level);
  const outOfStock = stock.filter(item => item.quantity === 0);

  // Top selling
  const itemCounts: Record<string, { name: string; totalSold: number }> = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (!itemCounts[item.item_name]) itemCounts[item.item_name] = { name: item.item_name, totalSold: 0 };
      itemCounts[item.item_name].totalSold += item.quantity;
    });
  });
  const topSelling = Object.values(itemCounts).sort((a, b) => b.totalSold - a.totalSold).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="gradient-primary rounded-xl p-6 text-primary-foreground">
        <h1 className="text-2xl font-bold">{currentBusiness?.name || 'My Business'}</h1>
        <div className="flex flex-wrap gap-4 mt-2 text-sm opacity-90">
          {currentBusiness?.address && <span>📍 {currentBusiness.address}</span>}
          {currentBusiness?.contact && <span>📞 {currentBusiness.contact}</span>}
          {currentBusiness?.email && <span>✉️ {currentBusiness.email}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Package className="h-5 w-5 text-primary" /></div>
              <div><p className="text-xs text-muted-foreground">Total Items</p><p className="text-xl font-bold">{stock.length}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10"><DollarSign className="h-5 w-5 text-success" /></div>
              <div><p className="text-xs text-muted-foreground">Today's Revenue</p><p className="text-xl font-bold">${todayRevenue.toLocaleString()}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10"><AlertTriangle className="h-5 w-5 text-warning" /></div>
              <div><p className="text-xs text-muted-foreground">Low Stock</p><p className="text-xl font-bold">{lowStock.length}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10"><XCircle className="h-5 w-5 text-destructive" /></div>
              <div><p className="text-xs text-muted-foreground">Out of Stock</p><p className="text-xl font-bold">{outOfStock.length}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" />Top Selling Items</CardTitle></CardHeader>
          <CardContent>
            {topSelling.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {topSelling.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span><span className="text-sm font-medium">{item.name}</span></div>
                    <span className="text-sm font-semibold text-primary">{item.totalSold} sold</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" />Stock Alerts</CardTitle></CardHeader>
          <CardContent>
            {lowStock.length === 0 && outOfStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">All stock levels are healthy.</p>
            ) : (
              <div className="space-y-2">
                {outOfStock.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-destructive/5">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs font-semibold text-destructive px-2 py-0.5 rounded-full bg-destructive/10">OUT OF STOCK</span>
                  </div>
                ))}
                {lowStock.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-warning/5">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs font-semibold text-warning px-2 py-0.5 rounded-full bg-warning/10">{item.quantity} left</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-primary" />Recent Sales</CardTitle></CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {sales.slice(0, 5).map(sale => (
                <div key={sale.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div>
                    <span className="text-sm font-medium">{sale.items.map(i => i.item_name).join(', ')}</span>
                    <p className="text-xs text-muted-foreground">{new Date(sale.created_at).toLocaleString()}</p>
                  </div>
                  <span className="text-sm font-bold text-success">${Number(sale.grand_total).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
