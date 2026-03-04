import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Award, Star, MapPin, ArrowRight, Users, Calendar, Globe, Heart } from 'lucide-react';
import { StylistCard } from '@/components/StylistCard';
import { AnimateOnScroll, useParallax, useCountUp } from '@/hooks/useScrollAnimation';
import { MOCK_STYLISTS } from '@/data/mockStylists';
import api from '@/services/api';

function StatCounter({ end, suffix = '', label, icon: Icon, decimals = 0 }) {
  const scaledEnd = decimals > 0 ? Math.round(end * Math.pow(10, decimals)) : end;
  const { count, ref } = useCountUp(scaledEnd, 2200);
  const display = decimals > 0 ? (count / Math.pow(10, decimals)).toFixed(decimals) : count;
  return (
    <div ref={ref} className="text-center space-y-2">
      <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
      <div className="font-cormorant text-5xl lg:text-6xl font-bold text-foreground">
        {display}{suffix}
      </div>
      <div className="text-sm font-montserrat text-muted-foreground tracking-widest uppercase">{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const [topStylists, setTopStylists] = useState(MOCK_STYLISTS.slice(0, 8));
  const parallaxOffset = useParallax(0.25);

  useEffect(() => {
    const fetchStylists = async () => {
      try {
        const response = await api.get('/search/stylists', { params: { sort_by: 'rating' } });
        const results = Array.isArray(response.data) ? response.data : (response.data.stylists || []);
        const mapped = results.map(s => ({
          stylist_id: s.stylist_id,
          name: s.name,
          average_rating: s.average_rating || 0,
          total_reviews: s.total_ratings || 0,
          hearts: s.hearts || Math.round((s.total_ratings || 0) * (s.average_rating || 0)),
          profile: {
            skills: s.skills || [],
            portfolio_images: s.profile_image ? [s.profile_image] : [],
            bio: s.bio,
            service_area: s.starting_price ? { address: `From $${s.starting_price}` } : null,
          },
        }));
        if (mapped.length >= 4) {
          setTopStylists(mapped.slice(0, 8));
        }
      } catch (error) {
        console.error('Failed to fetch stylists:', error);
      }
    };
    fetchStylists();
  }, []);

  return (
    <div className="min-h-screen overflow-hidden">
      <div className="grain-overlay" />

      {/* ─── HERO ─── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden" data-testid="hero-section">
        <div
          className="absolute inset-0 z-0"
          style={{ transform: `translateY(${parallaxOffset}px)` }}
        >
          <img
            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920"
            alt="Luxury beauty salon"
            className="w-full h-[110%] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="container mx-auto max-w-7xl px-6 relative z-10 py-20">
          <div className="max-w-2xl space-y-8">
            <AnimateOnScroll animation="fade-up" delay={0}>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-montserrat font-semibold tracking-[0.2em] text-primary uppercase">Luxury at your doorstep</span>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-up" delay={150}>
              <h1 className="font-cormorant text-7xl sm:text-8xl lg:text-9xl font-bold leading-[0.9] tracking-tight">
                <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent onda-glow">
                  Onda
                </span>
              </h1>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-up" delay={300}>
              <p className="text-xl text-foreground/70 leading-relaxed font-montserrat max-w-lg">
                Where elite beauty professionals bring sophistication to your doorstep. Premium services, dynamic pricing, and an experience designed around you.
              </p>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-up" delay={450}>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/register">
                  <Button className="btn-primary text-lg px-10 py-7 rounded-full group" data-testid="get-started-btn">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/browse">
                  <Button variant="ghost" className="btn-secondary text-lg px-10 py-7 rounded-full backdrop-blur-sm group" data-testid="browse-stylists-btn">
                    Discover Artists
                  </Button>
                </Link>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-up" delay={600}>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex -space-x-3">
                  {['E', 'S', 'M', 'J'].map((initial, i) => (
                    <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/80 to-secondary/80 border-2 border-background flex items-center justify-center text-xs font-bold text-black">
                      {initial}
                    </div>
                  ))}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="14" height="12" viewBox="0 0 24 22" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#ffb366" stroke="#ffb366" strokeWidth="1" strokeOpacity="0.8" />
                      </svg>
                    ))}
                    <span className="text-sm font-semibold text-foreground ml-1">4.9</span>
                  </div>
                  <p className="text-xs text-foreground/50 font-montserrat">Trusted by 5,000+ clients across Australia</p>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="w-6 h-10 rounded-full border-2 border-primary/40 flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-primary/60 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="relative py-20 px-6 border-y border-border/20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        <div className="container mx-auto max-w-5xl relative">
          <AnimateOnScroll animation="fade-up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatCounter end={200} suffix="+" label="Elite Artists" icon={Users} />
              <StatCounter end={5000} suffix="+" label="Bookings Made" icon={Calendar} />
              <StatCounter end={15} suffix="" label="Cities Served" icon={Globe} />
              <StatCounter end={4.9} suffix="" label="Avg Rating" icon={Heart} decimals={1} />
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ─── FEATURED IMAGE STRIP ─── */}
      <section className="py-24 px-6" data-testid="visual-strip">
        <div className="container mx-auto max-w-7xl">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-16 space-y-4">
              <span className="text-xs font-montserrat font-semibold tracking-[0.3em] text-primary uppercase">The Art of Beauty</span>
              <h2 className="font-cormorant text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Crafted With Passion
              </h2>
              <p className="text-muted-foreground font-montserrat max-w-xl mx-auto">
                Every appointment is a curated experience. Our artists don't just style — they transform.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { src: 'https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', label: 'Hair Styling', span: 'row-span-2', service: 'styling' },
              { src: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', label: 'Makeup', service: 'cosmetic_tattoo' },
              { src: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', label: 'Nails', service: 'nails' },
              { src: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', label: 'Skincare', service: 'facial' },
              { src: 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', label: 'Lashes & Brows', service: 'threading' },
              { src: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', label: 'Salon Experience', span: 'col-span-2', service: '' },
            ].map((img, idx) => (
              <AnimateOnScroll key={idx} animation="zoom-in" delay={idx * 100} className={img.span || ''}>
                <Link to={img.service ? `/browse?service=${img.service}` : '/browse'} className="block h-full">
                  <div className="relative group h-full min-h-[200px] md:min-h-[260px] rounded-xl overflow-hidden cursor-pointer">
                    <img
                      src={img.src}
                      alt={img.label}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="font-montserrat text-sm font-semibold tracking-wider text-white/90 uppercase">{img.label}</span>
                    </div>
                  </div>
                </Link>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ELITE ARTISTS ─── */}
      <section className="py-24 px-6 relative" data-testid="rotating-carousel-section">
        <div className="absolute inset-0 hero-gradient" />
        <div className="container mx-auto max-w-7xl relative z-10">
          <AnimateOnScroll animation="fade-up">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="text-xs font-montserrat font-semibold tracking-[0.3em] text-primary uppercase">Our Elite Artists</span>
                </div>
                <h2 className="font-cormorant text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Discover Excellence
                </h2>
                <p className="text-muted-foreground font-montserrat max-w-md">
                  Hand-picked professionals who set the standard for luxury beauty services.
                </p>
              </div>
              <Link to="/browse">
                <Button variant="outline" className="border border-primary/30 text-primary rounded-full px-8 py-5 hover:bg-primary/10 transition-all font-montserrat group">
                  View All Artists
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {topStylists.slice(0, 4).map((stylist, idx) => (
              <AnimateOnScroll key={stylist.stylist_id} animation="fade-up" delay={idx * 120} className="h-full">
                <StylistCard stylist={stylist} showFavorite={false} />
              </AnimateOnScroll>
            ))}
          </div>

          {topStylists.length > 4 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
              {topStylists.slice(4, 8).map((stylist, idx) => (
                <AnimateOnScroll key={stylist.stylist_id} animation="fade-up" delay={idx * 120} className="h-full">
                  <StylistCard stylist={stylist} showFavorite={false} />
                </AnimateOnScroll>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-24 px-6" data-testid="how-it-works-section">
        <div className="container mx-auto max-w-6xl">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-16 space-y-4">
              <span className="text-xs font-montserrat font-semibold tracking-[0.3em] text-primary uppercase">How It Works</span>
              <h2 className="font-cormorant text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                The Experience
              </h2>
              <p className="text-muted-foreground font-montserrat max-w-lg mx-auto">
                Seamless luxury in three simple steps
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-y-1/2 z-0" />

            {[
              {
                icon: <Star className="h-8 w-8" />,
                num: '01',
                title: 'Browse & Filter',
                desc: 'Explore services and stylists. Filter by speciality, price, and location. See real-time availability.'
              },
              {
                icon: <MapPin className="h-8 w-8" />,
                num: '02',
                title: 'Smart Pricing',
                desc: 'Dynamic pricing based on distance. Earn travel discounts through bookings. Track your stylist in real-time.'
              },
              {
                icon: <Sparkles className="h-8 w-8" />,
                num: '03',
                title: 'Premium Service',
                desc: 'Your artist arrives with professional equipment. Relax and enjoy luxury at your location.'
              }
            ].map((step, idx) => (
              <AnimateOnScroll key={idx} animation="fade-up" delay={idx * 200}>
                <Card className="luxury-card border-border/30 hover:border-primary/30 shadow-lg hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 relative z-10 group" data-testid={`step-card-${idx}`}>
                  <CardContent className="p-8 space-y-5 text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-500">
                      {step.icon}
                    </div>
                    <div className="font-cormorant italic text-6xl text-primary/20 font-bold">{step.num}</div>
                    <h3 className="font-cormorant text-2xl font-bold text-foreground">{step.title}</h3>
                    <p className="text-muted-foreground font-montserrat text-sm leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-24 px-6 relative overflow-hidden" data-testid="testimonials-section">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />
        <div className="container mx-auto max-w-7xl relative z-10">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-16 space-y-4">
              <span className="text-xs font-montserrat font-semibold tracking-[0.3em] text-primary uppercase">What Our Clients Say</span>
              <h2 className="font-cormorant text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Client Stories
              </h2>
              <p className="text-muted-foreground font-montserrat max-w-lg mx-auto">
                Real experiences from clients who've discovered the Onda difference.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'Sarah M.',
                location: 'Gold Coast, QLD',
                rating: 5,
                service: 'Hair Styling',
                text: "Onda completely changed how I experience beauty services. Having a top-tier stylist come to my home is pure luxury. The booking was seamless and Sophie was incredible.",
                initial: 'S'
              },
              {
                name: 'Emma T.',
                location: 'Brisbane, QLD',
                rating: 5,
                service: 'Bridal Makeup',
                text: "I booked for my wedding day and the artist was beyond talented. She arrived early, set up professionally, and made me feel like a queen. My bridesmaids all booked through Onda after!",
                initial: 'E'
              },
              {
                name: 'Jessica L.',
                location: 'Surfers Paradise, QLD',
                rating: 5,
                service: 'Facial Treatment',
                text: "The facial I received was spa-quality in my own living room. Ruby was so knowledgeable about skincare and the whole experience felt incredibly luxurious. Already rebooked!",
                initial: 'J'
              },
              {
                name: 'Michelle K.',
                location: 'Byron Bay, NSW',
                rating: 5,
                service: 'Nails',
                text: "As a busy mum, getting to the salon is nearly impossible. Onda brought the salon to me. My nails look incredible and I didn't have to organise a babysitter. Game changer.",
                initial: 'M'
              },
              {
                name: 'Chloe R.',
                location: 'Noosa, QLD',
                rating: 4,
                service: 'Hair Colouring',
                text: "I was nervous about getting colour done outside a salon, but Olivia was amazing. She brought everything, cleaned up perfectly, and my balayage is stunning. Will definitely use again.",
                initial: 'C'
              },
              {
                name: 'Priya N.',
                location: 'Broadbeach, QLD',
                rating: 5,
                service: 'Threading',
                text: "The convenience factor is unmatched. I found a threading specialist 10 minutes away, booked in seconds, and she was at my door within the hour. This is the future of beauty.",
                initial: 'P'
              }
            ].map((testimonial, idx) => (
              <AnimateOnScroll key={idx} animation="fade-up" delay={idx * 100}>
                <Card className="luxury-card border-border/30 hover:border-primary/20 transition-all duration-500 h-full">
                  <CardContent className="p-6 space-y-4 flex flex-col h-full">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-bold text-black flex-shrink-0">
                        {testimonial.initial}
                      </div>
                      <div className="min-w-0">
                        <p className="font-montserrat font-semibold text-foreground text-sm">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground font-montserrat">{testimonial.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} width="14" height="12" viewBox="0 0 24 22" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={i < testimonial.rating ? '#ffb366' : 'rgba(102,102,102,0.3)'} stroke={i < testimonial.rating ? '#ffb366' : '#666'} strokeWidth="1" strokeOpacity={i < testimonial.rating ? '0.8' : '0.5'} />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs text-primary/70 font-montserrat">{testimonial.service}</span>
                    </div>

                    <blockquote className="text-sm text-foreground/80 font-montserrat leading-relaxed flex-1 italic">
                      "{testimonial.text}"
                    </blockquote>
                  </CardContent>
                </Card>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-28 px-6 relative overflow-hidden" data-testid="cta-section">
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,179,102,0.12),transparent_70%)]" />
        <div className="container mx-auto max-w-3xl text-center space-y-8 relative z-10">
          <AnimateOnScroll animation="fade-up">
            <span className="text-xs font-montserrat font-semibold tracking-[0.3em] text-primary uppercase">Begin Today</span>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={100}>
            <h2 className="font-cormorant text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent leading-tight">
              Ready for Your Transformation?
            </h2>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={200}>
            <p className="text-lg text-muted-foreground font-montserrat max-w-lg mx-auto">
              Join thousands who've discovered a better way to beauty. Smart pricing, elite artists, at your doorstep.
            </p>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={300}>
            <Link to="/register">
              <Button className="btn-primary text-lg px-14 py-8 group" data-testid="cta-button">
                Begin Your Journey
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </AnimateOnScroll>
        </div>
      </section>
    </div>
  );
}
