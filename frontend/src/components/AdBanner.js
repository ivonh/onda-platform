import React from 'react';

const defaultAds = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=200&fit=crop',
    title: 'Premium Hair Products',
    link: 'https://example.com/hair-products',
    altText: 'Premium hair care products advertisement'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=200&fit=crop',
    title: 'Luxury Skincare',
    link: 'https://example.com/skincare',
    altText: 'Luxury skincare products advertisement'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=200&fit=crop',
    title: 'Professional Beauty Tools',
    link: 'https://example.com/beauty-tools',
    altText: 'Professional beauty tools advertisement'
  }
];

export function AdBanner({ ads = defaultAds, variant = 'horizontal' }) {
  if (!ads || ads.length === 0) return null;

  const ad = ads[Math.floor(Math.random() * ads.length)];

  if (variant === 'sidebar') {
    return (
      <a 
        href={ad.link} 
        target="_blank" 
        rel="noopener noreferrer sponsored"
        className="block group"
      >
        <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-card via-card/80 to-background hover:border-primary/40 transition-all duration-300">
          <div className="absolute top-2 right-2 z-10">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 bg-background/80 px-2 py-0.5 rounded">
              Sponsored
            </span>
          </div>
          <div className="aspect-[4/5] overflow-hidden">
            <img 
              src={ad.image} 
              alt={ad.altText}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="p-4 bg-gradient-to-t from-background/90 via-background/60 to-transparent absolute bottom-0 left-0 right-0">
            <p className="text-sm font-montserrat text-foreground group-hover:text-primary transition-colors">
              {ad.title}
            </p>
          </div>
        </div>
      </a>
    );
  }

  return (
    <a 
      href={ad.link} 
      target="_blank" 
      rel="noopener noreferrer sponsored"
      className="block group"
    >
      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-card via-card/80 to-background hover:border-primary/40 transition-all duration-300">
        <div className="absolute top-2 right-2 z-10">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 bg-background/80 px-2 py-0.5 rounded">
            Sponsored
          </span>
        </div>
        <div className="flex items-center">
          <div className="w-1/3 h-24 overflow-hidden">
            <img 
              src={ad.image} 
              alt={ad.altText}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="flex-1 p-4">
            <p className="font-montserrat text-foreground group-hover:text-primary transition-colors">
              {ad.title}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Discover premium beauty products</p>
          </div>
        </div>
      </div>
    </a>
  );
}

export function AdBannerLarge({ ads = defaultAds }) {
  if (!ads || ads.length === 0) return null;

  const ad = ads[Math.floor(Math.random() * ads.length)];

  return (
    <a 
      href={ad.link} 
      target="_blank" 
      rel="noopener noreferrer sponsored"
      className="block group"
    >
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-card via-card/80 to-background hover:border-primary/40 transition-all duration-300">
        <div className="absolute top-3 right-3 z-10">
          <span className="text-xs uppercase tracking-wider text-muted-foreground/60 bg-background/80 px-3 py-1 rounded-full">
            Sponsored
          </span>
        </div>
        <div className="h-32 md:h-40 overflow-hidden">
          <img 
            src={ad.image} 
            alt={ad.altText}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/80 to-transparent">
          <p className="font-cormorant text-xl text-foreground group-hover:text-primary transition-colors">
            {ad.title}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Shop exclusive beauty products</p>
        </div>
      </div>
    </a>
  );
}
