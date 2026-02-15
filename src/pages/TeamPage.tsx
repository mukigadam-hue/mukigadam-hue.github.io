import { useState, useEffect } from 'react';
import { useBusiness } from '@/context/BusinessContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Copy, Trash2, Shield, Crown, User } from 'lucide-react';
import { toast } from 'sonner';

interface Member {
  user_id: string;
  role: string;
  email: string;
  full_name: string;
}

export default function TeamPage() {
  const { currentBusiness, userRole, generateInviteCode, getMembers, removeMember, updateMemberRole } = useBusiness();
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';

  useEffect(() => {
    loadMembers();
  }, [currentBusiness]);

  async function loadMembers() {
    const data = await getMembers();
    setMembers(data);
  }

  async function handleGenerateCode() {
    setLoading(true);
    const code = await generateInviteCode();
    setInviteCode(code);
    setLoading(false);
  }

  function copyCode() {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      toast.success('Code copied! Share it via WhatsApp or any messaging app.');
    }
  }

  async function handleRemove(userId: string) {
    await removeMember(userId);
    loadMembers();
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Team Management</h1>
      <p className="text-sm text-muted-foreground">
        {currentBusiness?.name} — Manage your team members and invite new workers
      </p>

      {/* Invite Section */}
      {isOwnerOrAdmin && (
        <Card className="shadow-card">
          <CardContent className="p-4 space-y-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Invite Workers
            </h2>
            <p className="text-sm text-muted-foreground">
              Generate a code and share it via WhatsApp, SMS, or phone call. Workers can join using the code.
            </p>
            {inviteCode ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-muted rounded-lg p-3 text-center">
                  <span className="text-2xl font-mono font-bold tracking-widest">{inviteCode}</span>
                  <p className="text-xs text-muted-foreground mt-1">Expires in 7 days</p>
                </div>
                <Button variant="outline" onClick={copyCode}>
                  <Copy className="h-4 w-4 mr-2" />Copy
                </Button>
              </div>
            ) : (
              <Button onClick={handleGenerateCode} disabled={loading}>
                <UserPlus className="h-4 w-4 mr-2" />Generate Invite Code
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <h2 className="text-base font-semibold mb-3">Members ({members.length})</h2>
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
        </CardContent>
      </Card>
    </div>
  );
}
