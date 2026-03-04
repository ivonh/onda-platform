import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Search, Shield, Scissors, Handshake } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

export default function AdminClients() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const params = { role: 'client' };
      if (search) params.search = search;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data);
    } catch (error) {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchUsers();
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'stylist':
        return <Badge className="bg-primary/20 text-primary border-primary/30"><Scissors className="h-3 w-3 mr-1" />Stylist</Badge>;
      case 'partner':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><Handshake className="h-3 w-3 mr-1" />Partner</Badge>;
      default:
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><UserCircle className="h-3 w-3 mr-1" />Client</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-cormorant text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center gap-3">
          <UserCircle className="h-8 w-8 text-primary" />
          Clients
        </h1>
        <p className="text-muted-foreground mt-1">Manage registered clients</p>
      </div>

      <div className="p-3 rounded-lg border border-border/40 bg-card/30 text-sm font-medium text-muted-foreground inline-block">
        Total Clients: <span className="text-primary">{users.length}</span>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <Button type="submit" className="btn-primary">Search</Button>
      </form>

      <Card className="border-border/40">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Phone</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      <UserCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No clients found</p>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.user_id} className="border-b border-border/20 hover:bg-card/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                            {(u.first_name || u.name || u.email || '?')[0].toUpperCase()}
                          </div>
                          <span className="font-medium">
                            {u.first_name && u.last_name
                              ? `${u.first_name} ${u.last_name}`
                              : u.name || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{u.email}</td>
                      <td className="p-4">{getRoleBadge(u.role)}</td>
                      <td className="p-4 text-sm text-muted-foreground">{u.phone || '—'}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
