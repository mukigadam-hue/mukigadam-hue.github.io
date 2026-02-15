import { useState } from 'react';
import { useBusiness } from '@/context/BusinessContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Building2, KeyRound, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function BusinessSetupPage() {
  const { createBusiness, redeemInviteCode } = useBusiness();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await createBusiness(name.trim(), address.trim(), contact.trim(), email.trim());
    setLoading(false);
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    const success = await redeemInviteCode(inviteCode.trim());
    if (!success) {
      toast.error('Failed to join. Check the code and try again.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardContent className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">📦 BizTrack</h1>
            <p className="text-sm text-muted-foreground">Set up your business or join an existing one</p>
          </div>

          <div className="flex gap-2">
            <Button variant={tab === 'create' ? 'default' : 'outline'} className="flex-1" onClick={() => setTab('create')}>
              <Plus className="h-4 w-4 mr-2" />Create Business
            </Button>
            <Button variant={tab === 'join' ? 'default' : 'outline'} className="flex-1" onClick={() => setTab('join')}>
              <KeyRound className="h-4 w-4 mr-2" />Join with Code
            </Button>
          </div>

          <Separator />

          {tab === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Business Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required placeholder="My Shop" />
              </div>
              <div>
                <Label>Address</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St" />
              </div>
              <div>
                <Label>Contact</Label>
                <Input value={contact} onChange={e => setContact(e.target.value)} placeholder="+1 234 567 890" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="shop@example.com" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <Building2 className="h-4 w-4 mr-2" />Create Business
              </Button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <Label>Invite Code</Label>
                <Input
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  required
                  placeholder="Enter 6-character code"
                  maxLength={6}
                  className="text-center text-lg tracking-widest font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ask your business owner for the invite code. They can share it via WhatsApp, SMS, or any other platform.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <KeyRound className="h-4 w-4 mr-2" />Join Business
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
