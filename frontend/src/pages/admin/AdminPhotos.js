import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  Image,
  User
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

const PHOTO_TYPE_LABELS = {
  full_length_glamour: 'Full Length Glamour',
  head_and_shoulders: 'Head & Shoulders',
  work_sample: 'Work Sample',
  before_after: 'Before & After'
};

export default function AdminPhotos() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionNotes, setActionNotes] = useState({});
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const res = await api.get('/admin/photos/pending');
      setPhotos(res.data);
    } catch (error) {
      toast.error('Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (photoId, action) => {
    setProcessing(prev => ({ ...prev, [photoId]: true }));
    try {
      await api.put(`/admin/photos/${photoId}/moderate`, {
        action,
        notes: actionNotes[`photo_${photoId}`] || ''
      });
      toast.success(`Photo ${action}d`);
      setActionNotes(prev => ({ ...prev, [`photo_${photoId}`]: '' }));
      fetchPhotos();
    } catch (error) {
      toast.error('Failed to moderate photo');
    } finally {
      setProcessing(prev => ({ ...prev, [photoId]: false }));
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
          Photo Moderation
        </h1>
        <p className="text-muted-foreground mt-1">
          Review portfolio photos - only approve professional quality images
        </p>
      </div>

      <Card className="luxury-card border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-sm">
            <Image className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">
              <strong className="text-foreground">Quality standards:</strong> Professional full-length glamour or head & shoulders photos. Work samples should clearly showcase stylist's skills.
            </span>
          </div>
        </CardContent>
      </Card>

      {photos.length === 0 ? (
        <Card className="luxury-card">
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold">No pending photos</p>
            <p className="text-muted-foreground">All photos have been moderated</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {photos.length} photo{photos.length !== 1 ? 's' : ''} pending moderation
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map(photo => (
              <Card key={photo.photo_id} className="luxury-card overflow-hidden">
                <div className="aspect-square bg-muted relative">
                  <img 
                    src={photo.photo_url} 
                    alt="Portfolio" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                      const placeholder = document.createElement('div');
                      placeholder.innerHTML = '<span class="text-muted-foreground text-sm">Image unavailable</span>';
                      e.target.parentElement.appendChild(placeholder);
                    }}
                  />
                  <Badge className="absolute top-2 right-2 bg-background/80 text-foreground text-xs">
                    {PHOTO_TYPE_LABELS[photo.photo_type] || photo.photo_type}
                  </Badge>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{photo.stylist_name}</span>
                  </div>
                  {photo.caption && (
                    <p className="text-xs text-muted-foreground">{photo.caption}</p>
                  )}
                  <Textarea
                    placeholder="Rejection reason..."
                    value={actionNotes[`photo_${photo.photo_id}`] || ''}
                    onChange={(e) => setActionNotes(prev => ({ ...prev, [`photo_${photo.photo_id}`]: e.target.value }))}
                    className="bg-background text-xs"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={() => handleModerate(photo.photo_id, 'approve')}
                      className="flex-1 btn-primary"
                      disabled={processing[photo.photo_id]}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      size="sm"
                      variant="destructive"
                      onClick={() => handleModerate(photo.photo_id, 'reject')}
                      className="flex-1"
                      disabled={processing[photo.photo_id]}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
