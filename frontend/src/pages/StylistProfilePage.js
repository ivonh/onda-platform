import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Instagram, 
  Link2, 
  Save, 
  User, 
  Globe, 
  Twitter,
  Facebook,
  Youtube,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import StyleBookGallery from '@/components/StyleBookGallery';
import CredentialsSection from '@/components/CredentialsSection';

export default function StylistProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    bio: '',
    instagram: '',
    twitter: '',
    facebook: '',
    youtube: '',
    website: '',
    tiktok: '',
    styleBookPhotos: []
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/stylists/profile/me');
      const data = response.data;
      setProfile({
        bio: data.profile?.bio || '',
        instagram: data.profile?.social_links?.instagram || '',
        twitter: data.profile?.social_links?.twitter || '',
        facebook: data.profile?.social_links?.facebook || '',
        youtube: data.profile?.social_links?.youtube || '',
        website: data.profile?.social_links?.website || '',
        tiktok: data.profile?.social_links?.tiktok || '',
        styleBookPhotos: data.profile?.style_book_photos || []
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile. You can still edit and save.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/stylists/profile/update', {
        bio: profile.bio,
        social_links: {
          instagram: profile.instagram,
          twitter: profile.twitter,
          facebook: profile.facebook,
          youtube: profile.youtube,
          website: profile.website,
          tiktok: profile.tiktok
        },
        style_book_photos: profile.styleBookPhotos
      });
      toast.success('Profile saved successfully!');
    } catch (error) {
      toast.error('Failed to save profile');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotosChange = (photos) => {
    setProfile(prev => ({ ...prev, styleBookPhotos: photos }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="font-playfair text-4xl font-bold text-primary mb-2">
            Your Profile
          </h1>
          <p className="text-muted-foreground">
            Customize your bio, social links, and style book to showcase your work
          </p>
        </div>

        <div className="space-y-8">
          <Card className="border border-border/40">
            <CardHeader>
              <CardTitle className="font-playfair text-xl flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                About You
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bio" className="text-sm font-medium mb-2 block">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Tell clients about yourself, your experience, and what makes you unique..."
                  value={profile.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="min-h-[150px] bg-background border-border/40"
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {profile.bio.length}/1000 characters
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/40">
            <CardHeader>
              <CardTitle className="font-playfair text-xl flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                Social Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="instagram" className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-pink-500" />
                    Instagram
                  </Label>
                  <Input
                    id="instagram"
                    placeholder="@yourusername"
                    value={profile.instagram}
                    onChange={(e) => handleInputChange('instagram', e.target.value)}
                    className="bg-background border-border/40"
                  />
                </div>

                <div>
                  <Label htmlFor="tiktok" className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                    TikTok
                  </Label>
                  <Input
                    id="tiktok"
                    placeholder="@yourusername"
                    value={profile.tiktok}
                    onChange={(e) => handleInputChange('tiktok', e.target.value)}
                    className="bg-background border-border/40"
                  />
                </div>

                <div>
                  <Label htmlFor="twitter" className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Twitter className="h-4 w-4 text-blue-400" />
                    Twitter / X
                  </Label>
                  <Input
                    id="twitter"
                    placeholder="@yourusername"
                    value={profile.twitter}
                    onChange={(e) => handleInputChange('twitter', e.target.value)}
                    className="bg-background border-border/40"
                  />
                </div>

                <div>
                  <Label htmlFor="facebook" className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-blue-600" />
                    Facebook
                  </Label>
                  <Input
                    id="facebook"
                    placeholder="facebook.com/yourpage"
                    value={profile.facebook}
                    onChange={(e) => handleInputChange('facebook', e.target.value)}
                    className="bg-background border-border/40"
                  />
                </div>

                <div>
                  <Label htmlFor="youtube" className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Youtube className="h-4 w-4 text-red-500" />
                    YouTube
                  </Label>
                  <Input
                    id="youtube"
                    placeholder="youtube.com/@yourchannel"
                    value={profile.youtube}
                    onChange={(e) => handleInputChange('youtube', e.target.value)}
                    className="bg-background border-border/40"
                  />
                </div>

                <div>
                  <Label htmlFor="website" className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    placeholder="https://yourwebsite.com"
                    value={profile.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="bg-background border-border/40"
                  />
                </div>
              </div>

              {profile.instagram && (
                <div className="pt-4">
                  <Separator className="mb-4" />
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-pink-500/30 text-pink-400 bg-pink-500/5">
                      <Instagram className="h-3 w-3 mr-1" />
                      Instagram Preview
                    </Badge>
                    <a 
                      href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View Profile
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <StyleBookGallery 
            photos={profile.styleBookPhotos} 
            onChange={handlePhotosChange}
            maxPhotos={50}
          />

          <CredentialsSection />

          <div className="flex justify-end gap-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary px-8"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
