import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Award,
  MapPin,
  Briefcase,
  User,
  Mail,
  Phone
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export default function AdminOnboarding() {
  const [pendingStylists, setPendingStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionNotes, setActionNotes] = useState({});
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await api.get('/admin/stylists/pending');
      setPendingStylists(res.data);
    } catch (error) {
      toast.error('Failed to load pending stylists');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (stylistId, action) => {
    setProcessing(prev => ({ ...prev, [stylistId]: true }));
    try {
      await api.put(`/admin/stylists/${stylistId}/approval`, {
        action,
        notes: actionNotes[stylistId] || ''
      });
      toast.success(`Stylist ${action}d successfully`);
      setActionNotes(prev => ({ ...prev, [stylistId]: '' }));
      fetchPending();
    } catch (error) {
      toast.error(`Failed to ${action} stylist`);
    } finally {
      setProcessing(prev => ({ ...prev, [stylistId]: false }));
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
        <h1 className="font-cormorant text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Onboarding & HR
        </h1>
        <p className="text-muted-foreground mt-1">
          Review new stylist applications - check identity, qualifications, and proof of work
        </p>
      </div>

      <Card className="luxury-card border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-sm">
            <Award className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">
              <strong className="text-foreground">Approval Criteria:</strong> Valid driver's license or proof of identity, accreditation in their area or proof of work experience. Admin discretion applies.
            </span>
          </div>
        </CardContent>
      </Card>

      {pendingStylists.length === 0 ? (
        <Card className="luxury-card">
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold">All caught up!</p>
            <p className="text-muted-foreground">No pending stylist applications to review</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {pendingStylists.length} application{pendingStylists.length !== 1 ? 's' : ''} pending review
          </p>
          
          {pendingStylists.map(stylist => (
            <Card key={stylist.stylist_id} className="luxury-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{stylist.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {stylist.email}
                        </span>
                        {stylist.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {stylist.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-yellow-500/30 text-yellow-500">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Bio</p>
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                        <p className="text-sm leading-relaxed">{stylist.bio || 'No bio provided'}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(stylist.skills || []).map((skill, i) => (
                          <Badge key={i} variant="secondary" className="text-xs capitalize">{skill}</Badge>
                        ))}
                        {(!stylist.skills || stylist.skills.length === 0) && (
                          <span className="text-sm text-muted-foreground">No skills listed</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-6">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Experience</p>
                        <p className="text-sm flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {stylist.years_experience || 0} years
                        </p>
                      </div>
                      {stylist.service_address && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Location</p>
                          <p className="text-sm flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {stylist.service_address}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {stylist.credentials?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                          Submitted Credentials ({stylist.credentials.length})
                        </p>
                        <div className="space-y-2">
                          {stylist.credentials.map((cred, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/30">
                              <div className="flex items-center gap-2">
                                <Award className="h-3.5 w-3.5 text-primary" />
                                <span className="text-sm">{cred.credential_name}</span>
                              </div>
                              <Badge className="text-xs" variant={
                                cred.verification_status === 'verified' ? 'default' : 'outline'
                              }>
                                {cred.verification_status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Admin Notes</p>
                      <Textarea
                        placeholder="Add notes - e.g. 'Requires valid ID', 'Missing proof of work'..."
                        value={actionNotes[stylist.stylist_id] || ''}
                        onChange={(e) => setActionNotes(prev => ({ ...prev, [stylist.stylist_id]: e.target.value }))}
                        className="bg-background text-sm"
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleApproval(stylist.stylist_id, 'approve')}
                        className="btn-primary flex-1"
                        disabled={processing[stylist.stylist_id]}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => handleApproval(stylist.stylist_id, 'reject')}
                        className="flex-1"
                        disabled={processing[stylist.stylist_id]}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>

                {stylist.created_at && (
                  <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border/30">
                    Applied: {new Date(stylist.created_at).toLocaleDateString('en-AU', { 
                      day: 'numeric', month: 'long', year: 'numeric' 
                    })}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
