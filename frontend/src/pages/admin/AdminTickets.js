import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Ticket, Search, Clock, CheckCircle, AlertCircle, MessageSquare, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
];

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed'];

const getStatusBadge = (status) => {
  switch (status) {
    case 'open':
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><AlertCircle className="h-3 w-3 mr-1" />Open</Badge>;
    case 'in_progress':
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
    case 'resolved':
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Resolved</Badge>;
    case 'closed':
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30"><X className="h-3 w-3 mr-1" />Closed</Badge>;
    default:
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">{status}</Badge>;
  }
};

const getCategoryBadge = (category) => {
  switch (category) {
    case 'payment_dispute':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Payment Dispute</Badge>;
    case 'complaint':
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Complaint</Badge>;
    case 'service_issue':
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Service Issue</Badge>;
    case 'account_issue':
      return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Account Issue</Badge>;
    case 'general':
    default:
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">General</Badge>;
  }
};

const formatStatusLabel = (status) => {
  return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [activeTab]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeTab) params.status = activeTab;
      if (search) params.search = search;
      const res = await api.get('/tickets/', { params });
      setTickets(res.data);
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTickets();
  };

  const handleSelectTicket = (ticket) => {
    if (selectedTicket?.ticket_id === ticket.ticket_id) {
      setSelectedTicket(null);
      return;
    }
    setSelectedTicket(ticket);
    setEditStatus(ticket.status);
    setEditNotes(ticket.admin_notes || '');
  };

  const handleSave = async () => {
    if (!selectedTicket) return;
    try {
      setSaving(true);
      await api.put(`/tickets/${selectedTicket.ticket_id}`, {
        status: editStatus,
        admin_notes: editNotes,
      });
      toast.success('Ticket updated successfully');
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      toast.error('Failed to update ticket');
    } finally {
      setSaving(false);
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
          <Ticket className="h-8 w-8 text-primary" />
          Support Tickets
        </h1>
        <p className="text-muted-foreground mt-1">View and manage all support tickets</p>
      </div>

      <div className="p-3 rounded-lg border border-border/40 bg-card/30 text-sm font-medium text-muted-foreground inline-block">
        Total Tickets: <span className="text-primary">{tickets.length}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab.value)}
            className={activeTab === tab.value ? 'btn-primary' : ''}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by subject or description..."
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
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Ticket ID</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Subject</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Category</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">User Email</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <Ticket className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No tickets found</p>
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <>
                      <tr
                        key={ticket.ticket_id}
                        className={`border-b border-border/20 hover:bg-card/50 transition-colors cursor-pointer ${selectedTicket?.ticket_id === ticket.ticket_id ? 'bg-card/60' : ''}`}
                        onClick={() => handleSelectTicket(ticket)}
                      >
                        <td className="p-4 text-sm font-mono text-muted-foreground">
                          {ticket.ticket_id.substring(0, 8)}...
                        </td>
                        <td className="p-4 font-medium">{ticket.subject}</td>
                        <td className="p-4">{getCategoryBadge(ticket.category)}</td>
                        <td className="p-4 text-sm text-muted-foreground">{ticket.user_email}</td>
                        <td className="p-4">{getStatusBadge(ticket.status)}</td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                      {selectedTicket?.ticket_id === ticket.ticket_id && (
                        <tr key={`${ticket.ticket_id}-detail`}>
                          <td colSpan={6} className="p-0">
                            <div className="p-6 bg-card/40 border-b border-border/40 space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                  <MessageSquare className="h-5 w-5 text-primary" />
                                  Ticket Details
                                </h3>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); setSelectedTicket(null); }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                                    <p className="mt-1 text-sm">{ticket.description || 'No description provided'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                                    <div className="mt-1">{getCategoryBadge(ticket.category)}</div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Submitted By</label>
                                    <p className="mt-1 text-sm">{ticket.user_name || ticket.user_email}</p>
                                  </div>
                                  {ticket.booking_id && (
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Related Booking ID</label>
                                      <p className="mt-1 text-sm font-mono">{ticket.booking_id}</p>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Update Status</label>
                                    <select
                                      value={editStatus}
                                      onChange={(e) => setEditStatus(e.target.value)}
                                      className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                                    >
                                      {STATUS_OPTIONS.map((s) => (
                                        <option key={s} value={s}>{formatStatusLabel(s)}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Admin Notes</label>
                                    <Textarea
                                      value={editNotes}
                                      onChange={(e) => setEditNotes(e.target.value)}
                                      placeholder="Add internal notes about this ticket..."
                                      className="mt-1 bg-card border-border"
                                      rows={4}
                                    />
                                  </div>
                                  <Button
                                    onClick={(e) => { e.stopPropagation(); handleSave(); }}
                                    disabled={saving}
                                    className="btn-primary w-full"
                                  >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
