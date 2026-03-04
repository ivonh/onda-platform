import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  UserCheck, 
  Award,
  Image,
  ExternalLink
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [taxInfo, setTaxInfo] = useState([]);
  const [pendingStylists, setPendingStylists] = useState([]);
  const [pendingCredentials, setPendingCredentials] = useState([]);
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionNotes, setActionNotes] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, withdrawalsRes, taxRes, stylistsRes, credentialsRes, photosRes] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/withdrawals/pending'),
        api.get('/admin/tax-info'),
        api.get('/admin/stylists/pending'),
        api.get('/admin/credentials/pending'),
        api.get('/admin/photos/pending')
      ]);

      setStats(statsRes.data);
      setWithdrawals(withdrawalsRes.data);
      setTaxInfo(taxRes.data);
      setPendingStylists(stylistsRes.data);
      setPendingCredentials(credentialsRes.data);
      setPendingPhotos(photosRes.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Admin access required');
      } else {
        toast.error('Failed to load dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const approveWithdrawal = async (withdrawalId) => {
    try {
      await api.put(`/admin/withdrawals/${withdrawalId}/approve`);
      toast.success('Withdrawal approved');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to approve withdrawal');
    }
  };

  const handleStylistApproval = async (stylistId, action) => {
    try {
      await api.put(`/admin/stylists/${stylistId}/approval`, {
        action,
        notes: actionNotes[stylistId] || ''
      });
      toast.success(`Stylist ${action}d successfully`);
      setActionNotes(prev => ({ ...prev, [stylistId]: '' }));
      fetchDashboardData();
    } catch (error) {
      toast.error(`Failed to ${action} stylist`);
    }
  };

  const handleCredentialVerify = async (credentialId, action) => {
    try {
      await api.put(`/admin/credentials/${credentialId}/verify`, {
        action,
        notes: actionNotes[`cred_${credentialId}`] || ''
      });
      toast.success(`Credential ${action === 'verify' ? 'verified' : 'rejected'}`);
      setActionNotes(prev => ({ ...prev, [`cred_${credentialId}`]: '' }));
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to update credential');
    }
  };

  const handlePhotoModerate = async (photoId, action) => {
    try {
      await api.put(`/admin/photos/${photoId}/moderate`, {
        action,
        notes: actionNotes[`photo_${photoId}`] || ''
      });
      toast.success(`Photo ${action}d`);
      setActionNotes(prev => ({ ...prev, [`photo_${photoId}`]: '' }));
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to moderate photo');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="container mx-auto max-w-7xl">
        <h1 className="font-cormorant text-6xl font-bold mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Admin Dashboard</h1>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="luxury-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Total Stylists</p>
                <Users className="h-5 w-5 text-primary" />
              </div>
              <p className="text-4xl font-bold font-cormorant">{stats?.total_stylists || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.approved_stylists || 0} approved • {stats?.pending_stylists || 0} pending
              </p>
            </CardContent>
          </Card>

          <Card className="luxury-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-4xl font-bold font-cormorant">{stats?.total_clients || 0}</p>
            </CardContent>
          </Card>

          <Card className="luxury-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Platform Revenue</p>
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <p className="text-4xl font-bold font-cormorant">${stats?.platform_commission || 0}</p>
            </CardContent>
          </Card>

          <Card className="luxury-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-4xl font-bold font-cormorant">{(stats?.pending_credentials || 0) + (stats?.pending_photos || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.pending_credentials || 0} credentials • {stats?.pending_photos || 0} photos
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="stylists" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="stylists" className="relative">
              <UserCheck className="h-4 w-4 mr-2" />
              Stylists
              {pendingStylists.length > 0 && (
                <Badge className="ml-2 bg-yellow-500 text-xs">{pendingStylists.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="credentials">
              <Award className="h-4 w-4 mr-2" />
              Credentials
              {pendingCredentials.length > 0 && (
                <Badge className="ml-2 bg-yellow-500 text-xs">{pendingCredentials.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="photos">
              <Image className="h-4 w-4 mr-2" />
              Photos
              {pendingPhotos.length > 0 && (
                <Badge className="ml-2 bg-yellow-500 text-xs">{pendingPhotos.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="withdrawals">
              <DollarSign className="h-4 w-4 mr-2" />
              Payouts
            </TabsTrigger>
            <TabsTrigger value="tax">
              Tax Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stylists">
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="font-cormorant text-3xl">Pending Stylist Approvals</CardTitle>
                <p className="text-sm text-muted-foreground">Review bio, photos, and credentials before approving</p>
              </CardHeader>
              <CardContent>
                {pendingStylists.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending stylists</p>
                ) : (
                  <div className="space-y-6">
                    {pendingStylists.map(stylist => (
                      <div key={stylist.stylist_id} className="p-6 border border-border/40 rounded-lg">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{stylist.name}</h3>
                            <p className="text-sm text-muted-foreground">{stylist.email}</p>
                            {stylist.phone && <p className="text-sm text-muted-foreground">{stylist.phone}</p>}
                          </div>
                          <Badge variant="outline" className="border-yellow-500/30 text-yellow-500">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending Review
                          </Badge>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Bio</p>
                            <p className="text-sm bg-muted/50 p-3 rounded-lg">{stylist.bio || 'No bio provided'}</p>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Skills</p>
                              <div className="flex flex-wrap gap-1">
                                {(stylist.skills || []).map((skill, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Experience</p>
                              <p className="text-sm">{stylist.years_experience || 0} years</p>
                            </div>
                          </div>

                          {stylist.credentials?.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Credentials ({stylist.credentials.length})</p>
                              <div className="space-y-1">
                                {stylist.credentials.map((cred, i) => (
                                  <div key={i} className="flex items-center gap-2 text-sm">
                                    <Award className="h-3 w-3 text-primary" />
                                    {cred.credential_name}
                                    <Badge className="text-xs" variant={cred.verification_status === 'verified' ? 'success' : 'outline'}>
                                      {cred.verification_status}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Notes (optional)</p>
                            <Textarea
                              placeholder="Add notes for rejection reason..."
                              value={actionNotes[stylist.stylist_id] || ''}
                              onChange={(e) => setActionNotes(prev => ({ ...prev, [stylist.stylist_id]: e.target.value }))}
                              className="bg-background text-sm"
                              rows={2}
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleStylistApproval(stylist.stylist_id, 'approve')}
                              className="btn-primary"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button 
                              variant="destructive"
                              onClick={() => handleStylistApproval(stylist.stylist_id, 'reject')}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credentials">
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="font-cormorant text-3xl">Pending Credential Verification</CardTitle>
                <p className="text-sm text-muted-foreground">Verify professional certifications and licenses</p>
              </CardHeader>
              <CardContent>
                {pendingCredentials.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending credentials</p>
                ) : (
                  <div className="space-y-4">
                    {pendingCredentials.map(cred => (
                      <div key={cred.credential_id} className="p-4 border border-border/40 rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{cred.credential_name}</h4>
                            <p className="text-sm text-muted-foreground">Stylist: {cred.stylist_name}</p>
                            <p className="text-sm text-muted-foreground">Type: {cred.credential_type}</p>
                            {cred.issuing_organization && (
                              <p className="text-sm text-muted-foreground">Issuer: {cred.issuing_organization}</p>
                            )}
                          </div>
                          <a 
                            href={cred.document_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline text-sm"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Document
                          </a>
                        </div>

                        <div className="space-y-2">
                          <Textarea
                            placeholder="Verification notes..."
                            value={actionNotes[`cred_${cred.credential_id}`] || ''}
                            onChange={(e) => setActionNotes(prev => ({ ...prev, [`cred_${cred.credential_id}`]: e.target.value }))}
                            className="bg-background text-sm"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              onClick={() => handleCredentialVerify(cred.credential_id, 'verify')}
                              className="btn-primary"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Verify
                            </Button>
                            <Button 
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCredentialVerify(cred.credential_id, 'reject')}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos">
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="font-cormorant text-3xl">Photo Moderation</CardTitle>
                <p className="text-sm text-muted-foreground">Only approve professional full-length glamour or head & shoulders photos</p>
              </CardHeader>
              <CardContent>
                {pendingPhotos.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending photos</p>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingPhotos.map(photo => (
                      <div key={photo.photo_id} className="border border-border/40 rounded-lg overflow-hidden">
                        <div className="aspect-square bg-muted">
                          <img 
                            src={photo.photo_url} 
                            alt="Portfolio" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-medium">{photo.stylist_name}</p>
                          <p className="text-xs text-muted-foreground mb-2">Type: {photo.photo_type}</p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              onClick={() => handlePhotoModerate(photo.photo_id, 'approve')}
                              className="flex-1 btn-primary"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              OK
                            </Button>
                            <Button 
                              size="sm"
                              variant="destructive"
                              onClick={() => handlePhotoModerate(photo.photo_id, 'reject')}
                              className="flex-1"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="font-cormorant text-3xl">Pending Withdrawals</CardTitle>
                <p className="text-sm text-muted-foreground">Tuesday payout schedule</p>
              </CardHeader>
              <CardContent>
                {withdrawals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending withdrawals</p>
                ) : (
                  <div className="space-y-4">
                    {withdrawals.map(withdrawal => (
                      <div key={withdrawal.withdrawal_id} className="flex items-center justify-between p-4 border border-border/40 rounded-lg">
                        <div>
                          <p className="font-semibold">{withdrawal.stylist_name}</p>
                          <p className="text-sm text-muted-foreground">{withdrawal.stylist_email}</p>
                          <p className="text-lg font-bold text-primary mt-1">${withdrawal.amount}</p>
                        </div>
                        <Button onClick={() => approveWithdrawal(withdrawal.withdrawal_id)} className="btn-primary">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tax">
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="font-cormorant text-3xl">Tax Information</CardTitle>
                <p className="text-sm text-muted-foreground">Stylist earnings for tax reporting</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {taxInfo.map(stylist => (
                    <div key={stylist.stylist_id} className="p-4 border border-border/40 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">{stylist.name}</p>
                        <Badge className={stylist.has_tax_info ? 'bg-green-500' : 'bg-yellow-500'}>
                          {stylist.has_tax_info ? 'Complete' : 'Pending'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{stylist.email}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Earnings</p>
                          <p className="text-lg font-bold text-primary">${stylist.total_earnings}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Bookings</p>
                          <p className="text-lg font-bold">{stylist.total_bookings}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
