import { useState } from 'react';
import { useBusiness } from '@/context/BusinessContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, ShoppingCart, Receipt as ReceiptIcon } from 'lucide-react';
import Receipt from '@/components/Receipt';
import type { Sale } from '@/context/BusinessContext';

export default function SalesPage() {
  const { stock, sales, addSale, currentBusiness } = useBusiness();
  const [items, setItems] = useState<{ stock_item_id: string; item_name: string; category: string; quality: string; quantity: number; price_type: string; unit_price: number }[]>([]);
  const [selectedStock, setSelectedStock] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [priceType, setPriceType] = useState<'wholesale' | 'retail'>('retail');
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);

  const todaySales = sales.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString());

  function addItem() {
    const stockItem = stock.find(s => s.id === selectedStock);
    if (!stockItem) return;
    const qty = parseInt(quantity) || 1;
    const unitPrice = priceType === 'wholesale' ? Number(stockItem.wholesale_price) : Number(stockItem.retail_price);
    setItems(prev => [...prev, {
      stock_item_id: stockItem.id, item_name: stockItem.name, category: stockItem.category,
      quality: stockItem.quality, quantity: qty, price_type: priceType, unit_price: unitPrice,
    }]);
    setSelectedStock('');
    setQuantity('1');
  }

  function removeItem(idx: number) { setItems(prev => prev.filter((_, i) => i !== idx)); }

  const grandTotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  async function handleSave() {
    if (items.length === 0) return;
    await addSale(
      items.map(item => ({ ...item, subtotal: item.quantity * item.unit_price })),
      grandTotal, 'User'
    );
    setItems([]);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sales</h1>

      <Card className="shadow-card">
        <CardContent className="p-4 space-y-4">
          <h2 className="text-base font-semibold">Record New Sale</h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label>Item</Label>
              <Select value={selectedStock} onValueChange={setSelectedStock}>
                <SelectTrigger><SelectValue placeholder="Select item..." /></SelectTrigger>
                <SelectContent>
                  {stock.filter(s => s.quantity > 0).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} (qty: {s.quantity})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24"><Label>Qty</Label><Input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} /></div>
            <div className="w-32">
              <Label>Price Type</Label>
              <Select value={priceType} onValueChange={v => setPriceType(v as 'wholesale' | 'retail')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="retail">Retail</SelectItem><SelectItem value="wholesale">Wholesale</SelectItem></SelectContent>
              </Select>
            </div>
            <Button onClick={addItem} disabled={!selectedStock}><Plus className="h-4 w-4 mr-1" />Add</Button>
          </div>

          {items.length > 0 && (
            <>
              <Table>
                <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Unit Price</TableHead><TableHead className="text-right">Subtotal</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell className="capitalize">{item.price_type}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">${item.unit_price.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">${(item.quantity * item.unit_price).toFixed(2)}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => removeItem(i)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                  <TableRow><TableCell colSpan={4} className="text-right font-bold">Grand Total</TableCell><TableCell className="text-right font-bold text-lg">${grandTotal.toFixed(2)}</TableCell><TableCell></TableCell></TableRow>
                </TableBody>
              </Table>
              <Button onClick={handleSave} className="w-full"><ShoppingCart className="h-4 w-4 mr-2" />Record Sale — ${grandTotal.toFixed(2)}</Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-4">
          <h2 className="text-base font-semibold mb-3">Today's Sales ({todaySales.length})</h2>
          {todaySales.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales today yet.</p>
          ) : (
            <div className="space-y-3">
              {todaySales.map(sale => (
                <div key={sale.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{new Date(sale.created_at).toLocaleTimeString()}</span>
                      {sale.from_order_code && <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">From Order {sale.from_order_code}</span>}
                    </div>
                    <span className="font-bold text-success">${Number(sale.grand_total).toFixed(2)}</span>
                  </div>
                  <div className="text-sm space-y-1">
                    {sale.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-muted-foreground">
                        <span>{item.item_name} × {item.quantity} ({item.price_type})</span>
                        <span>${Number(item.subtotal).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setReceiptSale(sale)}>
                    <ReceiptIcon className="h-3.5 w-3.5 mr-1" />Receipt
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!receiptSale} onOpenChange={o => { if (!o) setReceiptSale(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Sale Receipt</DialogTitle></DialogHeader>
          {receiptSale && (
            <Receipt
              items={receiptSale.items.map(i => ({ itemName: i.item_name, quantity: i.quantity, priceType: i.price_type, unitPrice: Number(i.unit_price), subtotal: Number(i.subtotal) }))}
              grandTotal={Number(receiptSale.grand_total)}
              code={receiptSale.from_order_code || undefined}
              date={receiptSale.created_at}
              type="sale"
              businessInfo={currentBusiness ? { name: currentBusiness.name, address: currentBusiness.address, contact: currentBusiness.contact, email: currentBusiness.email } : undefined}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
