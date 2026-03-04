import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Award, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  XCircle,
  FileText,
  ExternalLink,
  Plus,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

const CREDENTIAL_TYPES = [
  { value: 'beauty_therapy_certificate', label: 'Beauty Therapy Certificate' },
  { value: 'hairdressing_certificate', label: 'Hairdressing Certificate' },
  { value: 'makeup_artistry_certificate', label: 'Makeup Artistry Certificate' },
  { value: 'nail_technician_certificate', label: 'Nail Technician Certificate' },
  { value: 'skin_care_certificate', label: 'Skin Care Certificate' },
  { value: 'massage_therapy_certificate', label: 'Massage Therapy Certificate' },
  { value: 'cosmetic_tattoo_certificate', label: 'Cosmetic Tattoo Certificate' },
  { value: 'first_aid_certificate', label: 'First Aid Certificate' },
  { value: 'business_license', label: 'Business License / ABN' },
  { value: 'insurance_certificate', label: 'Professional Insurance Certificate' },
  { value: 'other', label: 'Other Professional Qualification' }
];

export default function CredentialsSection() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [formData, setFormData] = useState({
    credential_type: '',
    credential_name: '',
    issuing_organization: '',
    credential_number: '',
    document_url: ''
  });

  useEffect(() => {
    fetchCredentials();
    fetchApprovalStatus();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await api.get('/credentials/my');
      setCredentials(response.data);
    } catch (error) {
      console.error('Failed to load credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovalStatus = async () => {
    try {
      const response = await api.get('/credentials/approval-status');
      setApprovalStatus(response.data);
    } catch (error) {
      console.error('Failed to load approval status:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.credential_type || !formData.credential_name || !formData.document_url) {
      toast.error('Please fill in all required fields');
      return;
    }

    setUploading(true);
    try {
      await api.post('/credentials/upload', formData);
      toast.success('Credential uploaded! It will be reviewed by our team.');
      setFormData({
        credential_type: '',
        credential_name: '',
        issuing_organization: '',
        credential_number: '',
        document_url: ''
      });
      setShowForm(false);
      fetchCredentials();
      fetchApprovalStatus();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload credential');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (credentialId) => {
    if (!window.confirm('Are you sure you want to delete this credential?')) return;
    
    try {
      await api.delete(`/credentials/${credentialId}`);
      toast.success('Credential deleted');
      fetchCredentials();
      fetchApprovalStatus();
    } catch (error) {
      toast.error('Failed to delete credential');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const getApprovalStatusBanner = () => {
    if (!approvalStatus) return null;
    
    switch (approvalStatus.approval_status) {
      case 'pending':
        return (
          <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-500">Profile Under Review</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Your profile is being reviewed by our team. Once approved, you'll be visible to clients.
                  Add your professional credentials to speed up the approval process.
                </p>
              </div>
            </div>
          </div>
        );
      case 'approved':
        return (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-500">Profile Approved</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Your profile is live and visible to clients. Keep your credentials up to date.
                </p>
              </div>
            </div>
          </div>
        );
      case 'rejected':
        return (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-500">Profile Changes Required</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {approvalStatus.approval_notes || 'Please review and update your profile.'}
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="border border-border/40">
        <CardContent className="py-8 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/40">
      <CardHeader>
        <CardTitle className="font-playfair text-xl flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Professional Credentials
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {getApprovalStatusBanner()}
        
        <div className="p-4 rounded-lg bg-muted/50 border border-border/40">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium">Build Trust with Clients</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Upload your professional certifications, qualifications, and insurance documents.
                Verified credentials are displayed on your public profile and help clients choose you with confidence.
              </p>
            </div>
          </div>
        </div>

        {credentials.length > 0 && (
          <div className="space-y-3">
            {credentials.map((cred) => (
              <div 
                key={cred.credential_id}
                className="p-4 rounded-lg border border-border/40 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium">{cred.credential_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {CREDENTIAL_TYPES.find(t => t.value === cred.credential_type)?.label || cred.credential_type}
                      </p>
                      {cred.issuing_organization && (
                        <p className="text-sm text-muted-foreground">
                          Issued by: {cred.issuing_organization}
                        </p>
                      )}
                      {cred.verification_notes && cred.verification_status === 'rejected' && (
                        <p className="text-sm text-red-400 mt-2">
                          Note: {cred.verification_notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(cred.verification_status)}
                    <a 
                      href={cred.document_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                    <button
                      onClick={() => handleDelete(cred.credential_id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
            <h4 className="font-medium">Add New Credential</h4>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Credential Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.credential_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, credential_type: value }))}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CREDENTIAL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Credential Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g., Certificate III in Beauty Services"
                  value={formData.credential_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, credential_name: e.target.value }))}
                  className="bg-background"
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Issuing Organization
                </Label>
                <Input
                  placeholder="e.g., TAFE Queensland"
                  value={formData.issuing_organization}
                  onChange={(e) => setFormData(prev => ({ ...prev, issuing_organization: e.target.value }))}
                  className="bg-background"
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Certificate/License Number
                </Label>
                <Input
                  placeholder="Optional"
                  value={formData.credential_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, credential_number: e.target.value }))}
                  className="bg-background"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Document URL <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="https://..."
                value={formData.document_url}
                onChange={(e) => setFormData(prev => ({ ...prev, document_url: e.target.value }))}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload your document to a cloud service (Google Drive, Dropbox) and paste the shareable link
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={uploading} className="btn-primary">
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Credential
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => setShowForm(true)}
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Professional Credential
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
