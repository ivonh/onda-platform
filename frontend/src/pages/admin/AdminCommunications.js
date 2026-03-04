import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Mail, 
  Send, 
  FileText,
  CheckCircle,
  UserCheck,
  XCircle,
  Award,
  PartyPopper
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

const EMAIL_TEMPLATES = [
  {
    id: 'welcome',
    name: 'Welcome - Approved Stylist',
    icon: PartyPopper,
    description: 'Send to newly approved stylists',
    subject: 'Welcome to Onda - You\'re Approved!',
    body: `Hi {stylist_name},

Congratulations! Your Onda profile has been approved. You are now live on the platform and can start receiving bookings from clients.

Here's what to do next:
- Complete your service pricing in your profile
- Set your availability in the calendar
- Upload professional portfolio photos

If you have any questions, don't hesitate to reach out.

Warm regards,
The Onda Team`
  },
  {
    id: 'rejection',
    name: 'Profile Rejection',
    icon: XCircle,
    description: 'Notify when profile needs changes',
    subject: 'Onda - Profile Review Update',
    body: `Hi {stylist_name},

Thank you for applying to Onda. After reviewing your profile, we need a few things before we can approve your application:

{rejection_reason}

Please update your profile and resubmit for review. We look forward to having you on the platform.

Kind regards,
The Onda Team`
  },
  {
    id: 'credential_request',
    name: 'Credential Request',
    icon: Award,
    description: 'Request additional documentation',
    subject: 'Onda - Documentation Required',
    body: `Hi {stylist_name},

To complete your verification on Onda, we need the following documentation:

- Valid driver's licence or government-issued photo ID
- Proof of professional accreditation or qualifications
- Any relevant industry certifications

You can upload these documents through your profile under the Credentials section.

Thank you for your cooperation.

Kind regards,
The Onda Team`
  },
  {
    id: 'credential_verified',
    name: 'Credential Verified',
    icon: CheckCircle,
    description: 'Confirm credential verification',
    subject: 'Onda - Credential Verified',
    body: `Hi {stylist_name},

Great news! Your credential "{credential_name}" has been verified. A verified badge will now appear on your public profile, helping build trust with potential clients.

Keep up the great work!

Warm regards,
The Onda Team`
  },
  {
    id: 'custom',
    name: 'Custom Email',
    icon: Mail,
    description: 'Write a custom email to a stylist',
    subject: '',
    body: ''
  }
];

export default function AdminCommunications() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sentHistory, setSentHistory] = useState([]);

  const selectTemplate = (template) => {
    setSelectedTemplate(template);
    setSubject(template.subject);
    setBody(template.body);
  };

  const sendEmail = async () => {
    if (!recipientEmail.trim()) {
      toast.error('Please enter a recipient email');
      return;
    }
    if (!subject.trim() || !body.trim()) {
      toast.error('Please fill in the subject and message');
      return;
    }

    setSending(true);
    try {
      await api.post('/admin/emails/send', {
        to_email: recipientEmail,
        subject: subject,
        body: body,
        template_id: selectedTemplate?.id || 'custom'
      });
      toast.success('Email sent successfully');
      setSentHistory(prev => [{
        to: recipientEmail,
        subject: subject,
        template: selectedTemplate?.name || 'Custom',
        sent_at: new Date().toISOString()
      }, ...prev]);
      setRecipientEmail('');
      if (selectedTemplate?.id !== 'custom') {
        setSubject(selectedTemplate?.subject || '');
        setBody(selectedTemplate?.body || '');
      } else {
        setSubject('');
        setBody('');
      }
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-cormorant text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Communications
        </h1>
        <p className="text-muted-foreground mt-1">
          Send emails to stylists using templates or custom messages
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Email Templates</p>
          {EMAIL_TEMPLATES.map(template => (
            <Card 
              key={template.id}
              className={`luxury-card cursor-pointer transition-all ${
                selectedTemplate?.id === template.id 
                  ? 'border-primary/40 bg-primary/5' 
                  : 'hover:border-primary/20'
              }`}
              onClick={() => selectTemplate(template)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <template.icon className={`h-4 w-4 mt-0.5 ${
                    selectedTemplate?.id === template.id ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{template.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card className="luxury-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-primary" />
                <p className="font-semibold">
                  {selectedTemplate ? selectedTemplate.name : 'Select a template'}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Recipient Email
                </label>
                <Input 
                  type="email"
                  placeholder="stylist@email.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="bg-background"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Subject
                </label>
                <Input 
                  placeholder="Email subject..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-background"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Message
                </label>
                <Textarea
                  placeholder="Write your message..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="bg-background text-sm min-h-[200px]"
                  rows={10}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use placeholders: {'{stylist_name}'}, {'{credential_name}'}, {'{rejection_reason}'}
                </p>
              </div>

              <Button 
                onClick={sendEmail}
                className="btn-primary w-full"
                disabled={sending || !recipientEmail.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Sending...' : 'Send Email'}
              </Button>
            </CardContent>
          </Card>

          {sentHistory.length > 0 && (
            <Card className="luxury-card">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">Recent Sent (this session)</p>
                <div className="space-y-2">
                  {sentHistory.map((email, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm">
                      <div>
                        <p className="font-medium">{email.subject}</p>
                        <p className="text-xs text-muted-foreground">To: {email.to}</p>
                      </div>
                      <Badge variant="outline" className="text-green-500 border-green-500/30">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Sent
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
