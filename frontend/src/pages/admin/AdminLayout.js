import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserPlus, 
  UserCircle,
  Scissors,
  Handshake,
  Award, 
  Image, 
  Receipt, 
  Mail, 
  Ticket,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react';

const navItems = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { path: '/admin/clients', label: 'Clients', icon: UserCircle },
  { path: '/admin/stylists', label: 'Stylists', icon: Scissors },
  { path: '/admin/partners', label: 'Partners', icon: Handshake },
  { path: '/admin/admins', label: 'Admins', icon: Shield },
  { path: '/admin/tickets', label: 'Support Tickets', icon: Ticket },
  { path: '/admin/onboarding', label: 'Onboarding / HR', icon: UserPlus },
  { path: '/admin/credentials', label: 'Credentials', icon: Award },
  { path: '/admin/photos', label: 'Photo Moderation', icon: Image },
  { path: '/admin/payslips', label: 'Payslips & Payouts', icon: Receipt },
  { path: '/admin/communications', label: 'Communications', icon: Mail },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      <aside className={`${collapsed ? 'w-16' : 'w-64'} border-r border-border/40 bg-card/30 flex flex-col transition-all duration-300 shrink-0`}>
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-cormorant text-lg font-bold text-primary">Admin</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
