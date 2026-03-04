import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, User, Calendar, LogOut, Heart, MessageCircle, DollarSign, Shield, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { NotificationDropdown } from '@/components/NotificationDropdown';

export const Navigation = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  const isLanding = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  const navBg = isLanding && !scrolled
    ? 'bg-transparent border-transparent'
    : 'glass-nav';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBg}`} data-testid="main-navigation">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="font-cormorant text-3xl font-bold tracking-wider" data-testid="logo-link">
            <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent onda-glow">
              ONDA
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link to="/browse" className="text-foreground/80 hover:text-primary transition-colors font-montserrat text-sm tracking-wide" data-testid="discover-link">
                  Discover
                </Link>
                <Link to={user.role === 'stylist' ? '/stylist/dashboard' : '/client/dashboard'} className="text-foreground/80 hover:text-primary transition-colors font-montserrat text-sm tracking-wide" data-testid="dashboard-link">
                  Dashboard
                </Link>
                {(user.role === 'client' || user.role === 'admin') && (
                  <Link to="/favorites" className="text-foreground/80 hover:text-primary transition-colors font-montserrat text-sm tracking-wide flex items-center gap-2" data-testid="favorites-link">
                    <Heart className="h-4 w-4" />
                    Favorites
                  </Link>
                )}
                {user.role === 'stylist' && (
                  <Link to="/stylist/earnings" className="text-foreground/80 hover:text-primary transition-colors font-montserrat text-sm tracking-wide flex items-center gap-2" data-testid="earnings-link">
                    <DollarSign className="h-4 w-4" />
                    Earnings
                  </Link>
                )}
                <Link to="/messages" className="text-foreground/80 hover:text-primary transition-colors font-montserrat text-sm tracking-wide flex items-center gap-2" data-testid="messages-link">
                  <MessageCircle className="h-4 w-4" />
                  Messages
                </Link>
                <NotificationDropdown />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full border border-primary/30 hover:bg-primary/10" data-testid="user-menu-trigger">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border" data-testid="user-menu-content">
                    {isAdmin && (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Panel
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={() => navigate('/bookings')} className="cursor-pointer">
                      <Calendar className="mr-2 h-4 w-4" />
                      My Bookings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer" data-testid="settings-link">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer" data-testid="logout-button">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/browse" className="text-foreground/80 hover:text-primary transition-colors font-montserrat text-sm tracking-wide" data-testid="browse-link">
                  Discover
                </Link>
                <Link to="/login" data-testid="login-link">
                  <Button variant="ghost" className="rounded-full text-foreground/80 hover:text-primary font-montserrat text-sm">Login</Button>
                </Link>
                <Link to="/register" data-testid="register-link">
                  <Button className="btn-primary text-sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
