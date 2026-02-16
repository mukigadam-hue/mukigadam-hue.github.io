import { useState, useEffect } from 'react';
import { useBusiness } from '@/context/BusinessContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Copy, Trash2, Shield, Crown, User, Users, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

interface Member {
  user_id: string;
  role: string;
  email: string;
  full_name: string;
}

interface Customer {
  id: string;
  user_id: string;
  customer_name: string;
  phone: string;
  created_at: string;
}

export default function TeamPage() {
  const { currentBusiness, userRole, generateInviteCode, getMembers, removeMember, updateMemberRole, getCustomers, removeCustomer } = useBusiness();
  const [members, setMembers] = useState<Member[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [workerCode, setWorkerCode] = useState<string | null>(null);
  const [customerCode, setCustomerCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';

  useEffect(() => {
    loadMembers();
    loadCustomers();
  }, [currentBusiness]);

  async function loadMembers() {
    const data = await getMembers();
    setMembers(data);
  }

  async function loadCustomers() {
    const data = await getCustomers();
    setCustomers(data);
  }

  async function handleGenerateCode(type: 'worker' | 'customer') {
    setLoading(true);
    const code = await generateInviteCode(type);
    if (type === 'worker') setWorkerCode(code);
    else setCustomerCode(code);
    setLoading(false);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success('Code copied! Share it via WhatsApp or any messaging app.');
  }

  async function handleRemove(userId: string) {
    await removeMember(userId);
    loadMembers();
  }

  async function handleRemoveCustomer(id: string) {
    await removeCustomer(id);
    loadCustomers();
  }

  async function handleRoleChange(userId: string, role: string) {
    await updateMemberRole(userId, role);
    loadMembers();
  }

  function getRoleIcon(role: string) {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-warning" />;
      case 'admin': return <Shield className="h-4 w-4 text-primary" />;
      default: return <User className="h-4 w-4 text-muted-foreground" />;
    }
  }

  function InviteSection({ type, code, onGenerate }: { type: 'worker' | 'customer'; code: string | null; onGenerate: () => void }) {
    const isWorker = type === 'worker';
    return (
      <Card className="shadow-card border-dashed">
        <CardContent className="p-4 space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            {isWorker ? 'Invite Workers' : 'Invite Customers'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isWorker
              ? 'Generate a code to add team members who can manage stock, sales & orders.'
              : 'Generate a code for customers so they can place orders through the app.'}
          </p>
          {code ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-lg p-3 text-center" style={{ backgroundColor: isWorker ? 'hsl(var(--primary) / 0.08)' : 'hsl(var(--accent) / 0.3)' }}>
                <span className="text-2xl font-mono font-bold tracking-widest">{code}</span>
                <p className="text-xs text-muted-foreground mt-1">
                  {isWorker ? '🔐 Worker Code — Expires in 7 days' : '🛒 Customer Code — Expires in 7 days'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => copyCode(code)}>
                <Copy className="h-4 w-4 mr-1" />Copy
              </Button>
            </div>
          ) : (
            <Button onClick={onGenerate} disabled={loading} variant={isWorker ? 'default' : 'secondary'}>
              <UserPlus className="h-4 w-4 mr-2" />
              Generate {isWorker ? 'Worker' : 'Customer'} Code
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team & Customers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {currentBusiness?.name} — Manage your workers and customers
        </p>
      </div>

      <Tabs defaultValue="workers" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Workers ({members.length})
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Customers ({customers.length})
          </TabsTrigger>
        </TabsList>

        {/* Workers Tab */}
        <TabsContent value="workers" className="space-y-4 mt-4">
          {isOwnerOrAdmin && (
            <InviteSection type="worker" code={workerCode} onGenerate={() => handleGenerateCode('worker')} />
          )}

          <Card className="shadow-card">
            <CardContent className="p-4">
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" /> Team Members
              </h2>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No team members yet. Generate an invite code to add workers.</p>
              ) : (
                <div className="space-y-3">
                  {members.map(member => (
                    <div key={member.user_id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {getRoleIcon(member.role)}
                        <div>
                          <p className="font-medium text-sm">{member.full_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOwnerOrAdmin && member.role !== 'owner' ? (
                          <>
                            <Select value={member.role} onValueChange={v => handleRoleChange(member.user_id, v)}>
                              <SelectTrigger className="w-28 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="worker">Worker</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" onClick={() => handleRemove(member.user_id)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs font-medium capitalize px-2 py-1 rounded-full bg-muted">
                            {member.role}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4 mt-4">
          {isOwnerOrAdmin && (
            <InviteSection type="customer" code={customerCode} onGenerate={() => handleGenerateCode('customer')} />
          )}

          <Card className="shadow-card">
            <CardContent className="p-4">
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" /> Customer List
              </h2>
              {customers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No customers yet. Generate an invite code to add customers.</p>
              ) : (
                <div className="space-y-3">
                  {customers.map(customer => (
                    <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{customer.customer_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{customer.phone || 'No phone'}</p>
                        </div>
                      </div>
                      {isOwnerOrAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveCustomer(customer.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
