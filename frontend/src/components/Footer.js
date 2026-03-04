import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Youtube,
  Mail,
  MapPin,
  Phone
} from 'lucide-react';

function TikTokIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.1a8.16 8.16 0 0 0 4.76 1.52v-3.4c-.83 0-1.63-.19-2.35-.53h-.01l.01.01Z" />
    </svg>
  );
}

const socialLinks = [
  { href: 'https://tiktok.com/@onda', label: 'TikTok', icon: TikTokIcon },
  { href: 'https://instagram.com/onda', label: 'Instagram', icon: Instagram },
  { href: 'https://facebook.com/onda', label: 'Facebook', icon: Facebook },
  { href: 'https://twitter.com/onda', label: 'Twitter', icon: Twitter },
  { href: 'https://youtube.com/@onda', label: 'YouTube', icon: Youtube },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border/20 mt-auto overflow-hidden">
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,179,102,0.06),transparent_60%)]" />
      
      <div className="container mx-auto max-w-7xl px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4 space-y-6">
            <h3 className="font-cormorant text-3xl font-bold">
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent onda-glow">Onda</span>
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Elite beauty professionals serving Gold Coast to South Brisbane. Premium mobile services brought directly to you.
            </p>
            <div className="flex gap-3 pt-2">
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <a 
                  key={label}
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-card/50 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-all duration-300"
                  aria-label={label}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <h4 className="font-montserrat font-semibold text-foreground text-sm tracking-wider uppercase">Explore</h4>
            <ul className="space-y-3">
              {[
                { to: '/browse', label: 'Find a Stylist' },
                { to: '/register', label: 'Become a Partner' },
                { to: '/services', label: 'Our Services' },
                { to: '/login', label: 'Sign In' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2 space-y-4">
            <h4 className="font-montserrat font-semibold text-foreground text-sm tracking-wider uppercase">Legal</h4>
            <ul className="space-y-3">
              {[
                { to: '/privacy', label: 'Privacy Policy' },
                { to: '/terms', label: 'Terms & Conditions' },
                { to: '/terms', label: 'Refund Policy' },
              ].map((link, idx) => (
                <li key={idx}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 space-y-4">
            <h4 className="font-montserrat font-semibold text-foreground text-sm tracking-wider uppercase">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                hello@onda.com.au
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                1300 BEAUTY (232 889)
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>1/25 Ahern Street<br />Labrador QLD 4215<br />Australia</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-10 bg-border/20" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground/60 font-montserrat">
            &copy; {currentYear} Onda. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/40 font-montserrat">
            Serving Gold Coast, Brisbane & South East Queensland
          </p>
        </div>
      </div>
    </footer>
  );
}
