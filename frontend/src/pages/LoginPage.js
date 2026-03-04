import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { toast } from 'sonner';

function OndaBrandMark() {
  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="relative">
        <h1 className="font-cormorant text-8xl md:text-9xl font-bold leading-none tracking-tight">
          <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent onda-glow">
            Onda
          </span>
        </h1>
        <div className="absolute -inset-8 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-full blur-3xl -z-10" />
      </div>
      <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
      <p className="font-montserrat text-sm tracking-[0.35em] text-primary/60 uppercase">
        Beauty Elevated
      </p>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;
      
      login(data.access_token, data.user, rememberMe);
      toast.success('Login successful!');
      
      if (data.user.role === 'stylist') {
        navigate('/stylist/dashboard');
      } else if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/services');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-6 relative overflow-hidden">
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(255,179,102,0.08),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(255,179,102,0.05),transparent_50%)]" />

      <div className="relative z-10 w-full max-w-4xl flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <OndaBrandMark />
        </div>

        <div className="lg:hidden mb-4">
          <OndaBrandMark />
        </div>

        <Card className="w-full max-w-md border border-border/40 shadow-2xl shadow-primary/5 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="font-cormorant text-3xl text-center text-primary">Welcome Back</CardTitle>
            <CardDescription className="text-center">Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-card border-border"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-card border-border"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                />
                <Label htmlFor="remember-me" className="text-sm text-muted-foreground cursor-pointer select-none">
                  Remember me
                </Label>
              </div>

              <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
