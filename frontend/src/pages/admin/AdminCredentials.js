import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  Award,
  ExternalLink,
  Calendar,
  Building,
  FileText
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export default function AdminCredentials() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionNotes, setActionNotes] = useState({});
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const res = await api.get('/admin/credentials/pending');
      setCredentials(res.data);
    } catch (error) {
      toast.error('Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (credentialId, action) => {
    setProcessing(prev => ({ ...prev, [credentialId]: true }));
    try {
      await api.put(`/admin/credentials/${credentialId}/verify`, {
        action,
        notes: actionNotes[`cred_${credentialId}`] || ''
      });
      toast.success(`Credential ${action === 'verify' ? 'verified' : 'rejected'}`);
      setActionNotes(prev => ({ ...prev, [`cred_${credentialId}`]: '' }));
      fetchCredentials();
    } catch (error) {
      toast.error('Failed to update credential');
    } finally {
      setProcessing(prev => ({ ...prev, [credentialId]: false }));
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
          Credential Verification
        </h1>
        <p className="text-muted-foreground mt-1">
          Verify professional certifications, licenses, and accreditations
        </p>
      </div>

      <Card className="luxury-card border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-sm">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">
              <strong className="text-foreground">Accepted documents:</strong> Driver's license, professional certifications, accreditation certificates, proof of work/training records
            </span>
          </div>
        </CardContent>
      </Card>

      {credentials.length === 0 ? (
        <Card className="luxury-card">
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold">No pending credentials</p>
            <p className="text-muted-foreground">All credentials have been reviewed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {credentials.length} credential{credentials.length !== 1 ? 's' : ''} pending verification
          </p>

          {credentials.map(cred => (
            <Card key={cred.credential_id} className="luxury-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Award className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{cred.credential_name}</h3>
                      <p className="text-sm text-muted-foreground">Submitted by: {cred.stylist_name}</p>
                    </div>
                  </div>
                  {cred.document_url && (
                    <a 
                      href={cred.document_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline text-sm px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/20"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Document
                    </a>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="capitalize">{cred.credential_type}</Badge>
                    </div>
                    {cred.issuing_organization && (
                      <p className="text-sm flex items-center gap-2">
                        <Building className="h-3.5 w-3.5 text-muted-foreground" />
                        {cred.issuing_organization}
                      </p>
                    )}
                    {cred.credential_number && (
                      <p className="text-sm text-muted-foreground">
                        Credential #: {cred.credential_number}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    {cred.issue_date && (
                      <p className="text-sm flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        Issued: {new Date(cred.issue_date).toLocaleDateString('en-AU')}
                      </p>
                    )}
                    {cred.expiry_date && (
                      <p className="text-sm flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        Expires: {new Date(cred.expiry_date).toLocaleDateString('en-AU')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border/30">
                  <Textarea
                    placeholder="Verification notes..."
                    value={actionNotes[`cred_${cred.credential_id}`] || ''}
                    onChange={(e) => setActionNotes(prev => ({ ...prev, [`cred_${cred.credential_id}`]: e.target.value }))}
                    className="bg-background text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleVerify(cred.credential_id, 'verify')}
                      className="btn-primary"
                      disabled={processing[cred.credential_id]}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => handleVerify(cred.credential_id, 'reject')}
                      disabled={processing[cred.credential_id]}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
