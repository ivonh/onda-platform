import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [activeTab, setActiveTab] = useState('client');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [clientForm, setClientForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    date_of_birth: ''
  });

  const [stylistForm, setStylistForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    phone: '',
    skills: [],
    service_address: ''
  });

  const serviceOptions = [
    { value: 'haircut', label: 'Haircut' },
    { value: 'coloring', label: 'Coloring' },
    { value: 'styling', label: 'Styling' },
    { value: 'facial', label: 'Facial' },
    { value: 'nails', label: 'Nails' },
    { value: 'threading', label: 'Threading' },
    { value: 'waxing', label: 'Waxing' },
    { value: 'cosmetic_tattoo', label: 'Cosmetic Tattoo' }
  ];

  const validateAge = (dob) => {
    if (!dob) return false;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18;
  };

  const getMaxDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date.toISOString().split('T')[0];
  };

  const handleClientSubmit = async (e) => {
    e.preventDefault();
    
    if (!clientForm.email || !clientForm.password || !clientForm.first_name || !clientForm.last_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!clientForm.date_of_birth) {
      toast.error('Date of birth is required');
      return;
    }

    if (!validateAge(clientForm.date_of_birth)) {
      toast.error('You must be at least 18 years old to register');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', {
        email: clientForm.email,
        password: clientForm.password,
        first_name: clientForm.first_name,
        last_name: clientForm.last_name,
        date_of_birth: clientForm.date_of_birth,
        role: 'client'
      });
      
      login(response.data.access_token, response.data.user);
      toast.success('Registration successful!');
      navigate('/services');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStylistSubmit = async (e) => {
    e.preventDefault();
    
    if (!stylistForm.email || !stylistForm.password || !stylistForm.first_name || !stylistForm.last_name || !stylistForm.phone || stylistForm.skills.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!stylistForm.date_of_birth) {
      toast.error('Date of birth is required');
      return;
    }

    if (!validateAge(stylistForm.date_of_birth)) {
      toast.error('You must be at least 18 years old to register');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/stylists/register', {
        email: stylistForm.email,
        password: stylistForm.password,
        first_name: stylistForm.first_name,
        last_name: stylistForm.last_name,
        name: `${stylistForm.first_name} ${stylistForm.last_name}`.trim(),
        date_of_birth: stylistForm.date_of_birth,
        phone: stylistForm.phone,
        profile: {
          skills: stylistForm.skills,
          bio: '',
          service_area: {
            latitude: -27.4698,
            longitude: 153.0251,
            address: stylistForm.service_address || 'Gold Coast, QLD'
          },
          service_radius_miles: 15.0,
          portfolio_images: []
        },
        pricing: stylistForm.skills.map(skill => ({
          service: skill,
          price_min: 50.0,
          price_max: 150.0,
          duration_minutes: 60
        }))
      });
      
      login(response.data.access_token, response.data.user);
      toast.success('Stylist registration successful!');
      navigate('/stylist/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const addSkill = (skill) => {
    if (skill && !stylistForm.skills.includes(skill)) {
      setStylistForm(prev => ({ ...prev, skills: [...prev.skills, skill] }));
    }
  };

  const removeSkill = (skill) => {
    setStylistForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-6 hero-gradient">
      <Card className="w-full max-w-lg border border-border/40 shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="font-cormorant text-3xl text-center text-primary">Create Account</CardTitle>
          <CardDescription className="text-center">Join Onda</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="client">I'm a Client</TabsTrigger>
              <TabsTrigger value="stylist">I'm a Stylist</TabsTrigger>
            </TabsList>

            <TabsContent value="client">
              <form onSubmit={handleClientSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      placeholder="Jane"
                      value={clientForm.first_name}
                      onChange={(e) => setClientForm(prev => ({ ...prev, first_name: e.target.value }))}
                      className="bg-card border-border"
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      placeholder="Smith"
                      value={clientForm.last_name}
                      onChange={(e) => setClientForm(prev => ({ ...prev, last_name: e.target.value }))}
                      className="bg-card border-border"
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    max={getMaxDate()}
                    value={clientForm.date_of_birth}
                    onChange={(e) => setClientForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    className="bg-card border-border"
                    autoComplete="bday"
                    lang="en-AU"
                    placeholder="DD/MM/YYYY"
                  />
                  <p className="text-xs text-muted-foreground">DD/MM/YYYY — You must be 18 or older to register</p>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={clientForm.email}
                    onChange={(e) => setClientForm(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-card border-border"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="Min 8 characters"
                    value={clientForm.password}
                    onChange={(e) => setClientForm(prev => ({ ...prev, password: e.target.value }))}
                    className="bg-card border-border"
                    autoComplete="new-password"
                  />
                </div>

                <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="stylist">
              <form onSubmit={handleStylistSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      placeholder="Jane"
                      value={stylistForm.first_name}
                      onChange={(e) => setStylistForm(prev => ({ ...prev, first_name: e.target.value }))}
                      className="bg-card border-border"
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      placeholder="Smith"
                      value={stylistForm.last_name}
                      onChange={(e) => setStylistForm(prev => ({ ...prev, last_name: e.target.value }))}
                      className="bg-card border-border"
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      max={getMaxDate()}
                      value={stylistForm.date_of_birth}
                      onChange={(e) => setStylistForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                      className="bg-card border-border"
                      autoComplete="bday"
                      lang="en-AU"
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      placeholder="+61 4XX XXX XXX"
                      value={stylistForm.phone}
                      onChange={(e) => setStylistForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-card border-border"
                      autoComplete="tel"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground -mt-2">DD/MM/YYYY — You must be 18 or older to register</p>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={stylistForm.email}
                    onChange={(e) => setStylistForm(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-card border-border"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="Min 8 characters"
                    value={stylistForm.password}
                    onChange={(e) => setStylistForm(prev => ({ ...prev, password: e.target.value }))}
                    className="bg-card border-border"
                    autoComplete="new-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Services You Offer</Label>
                  <Select onValueChange={addSkill}>
                    <SelectTrigger className="bg-card border-border">
                      <SelectValue placeholder="Select services" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {stylistForm.skills.map(skill => (
                      <span 
                        key={skill} 
                        className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm cursor-pointer hover:bg-primary/30"
                        onClick={() => removeSkill(skill)}
                      >
                        {serviceOptions.find(o => o.value === skill)?.label} x
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Service Address</Label>
                  <Input
                    placeholder="123 Main St, Gold Coast, QLD"
                    value={stylistForm.service_address}
                    onChange={(e) => setStylistForm(prev => ({ ...prev, service_address: e.target.value }))}
                    className="bg-card border-border"
                  />
                </div>

                <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Stylist Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
