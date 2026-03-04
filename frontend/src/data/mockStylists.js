// Mock stylists data for Gold Coast to South Brisbane area
export const MOCK_STYLISTS = [
  {
    stylist_id: "stylist_001",
    name: "Sophie Chen",
    email: "sophie@onda.com",
    profile: {
      skills: ["haircut", "coloring", "styling"],
      bio: "Award-winning hair stylist with 12 years experience. Specializing in balayage and modern cuts.",
      service_area: {
        latitude: -27.9380,
        longitude: 153.3960,
        address: "Labrador, Gold Coast QLD"
      },
      service_radius_miles: 30,
      portfolio_images: ["https://images.unsplash.com/photo-1562322140-8baeececf3df?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"]
    },
    pricing: [
      { service: "haircut", price_min: 65, price_max: 120, duration_minutes: 45 },
      { service: "coloring", price_min: 150, price_max: 350, duration_minutes: 120 },
      { service: "styling", price_min: 80, price_max: 150, duration_minutes: 60 }
    ],
    average_rating: 4.9,
    total_reviews: 234,
    hearts: 1800,
    is_gold_standard: true,
    is_top_5_percent: true
  },
  {
    stylist_id: "stylist_002",
    name: "Marcus Webb",
    email: "marcus@onda.com",
    profile: {
      skills: ["haircut", "styling", "coloring"],
      bio: "Men's grooming specialist. Expert in fades, classic cuts and beard styling.",
      service_area: {
        latitude: -27.9650,
        longitude: 153.4280,
        address: "Southport, Gold Coast QLD"
      },
      service_radius_miles: 25,
      portfolio_images: ["https://images.unsplash.com/photo-1621605815971-fbc98d665033?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"]
    },
    pricing: [
      { service: "haircut", price_min: 45, price_max: 85, duration_minutes: 30 },
      { service: "styling", price_min: 35, price_max: 60, duration_minutes: 20 },
      { service: "coloring", price_min: 80, price_max: 150, duration_minutes: 60 }
    ],
    average_rating: 4.8,
    total_reviews: 178,
    hearts: 750,
    is_gold_standard: true,
    is_top_5_percent: true
  },
  {
    stylist_id: "stylist_003",
    name: "Isabella Romano",
    email: "isabella@onda.com",
    profile: {
      skills: ["facial", "threading", "waxing"],
      bio: "Luxury skincare expert trained in Paris. Specializing in anti-aging treatments.",
      service_area: {
        latitude: -28.0027,
        longitude: 153.4300,
        address: "Surfers Paradise, Gold Coast QLD"
      },
      service_radius_miles: 35,
      portfolio_images: ["https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"]
    },
    pricing: [
      { service: "facial", price_min: 120, price_max: 280, duration_minutes: 75 },
      { service: "threading", price_min: 25, price_max: 55, duration_minutes: 20 },
      { service: "waxing", price_min: 45, price_max: 120, duration_minutes: 45 }
    ],
    average_rating: 4.95,
    total_reviews: 312,
    hearts: 2800,
    is_gold_standard: true,
    is_top_5_percent: true
  },
  {
    stylist_id: "stylist_004",
    name: "Jade Nguyen",
    email: "jade@onda.com",
    profile: {
      skills: ["nails", "waxing"],
      bio: "Nail artist extraordinaire. Known for intricate nail art and gel extensions.",
      service_area: {
        latitude: -28.0792,
        longitude: 153.4380,
        address: "Broadbeach, Gold Coast QLD"
      },
      service_radius_miles: 25,
      portfolio_images: ["https://images.unsplash.com/photo-1604654894610-df63bc536371?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"]
    },
    pricing: [
      { service: "nails", price_min: 55, price_max: 150, duration_minutes: 60 },
      { service: "waxing", price_min: 40, price_max: 100, duration_minutes: 40 }
    ],
    average_rating: 4.85,
    total_reviews: 198,
    hearts: 820,
    is_gold_standard: true,
    is_top_5_percent: false
  },
  {
    stylist_id: "stylist_005",
    name: "Emma Thompson",
    email: "emma@onda.com",
    profile: {
      skills: ["cosmetic_tattoo", "threading"],
      bio: "Cosmetic tattoo specialist. Expert in microblading, lip blush and eyeliner.",
      service_area: {
        latitude: -27.8950,
        longitude: 153.3850,
        address: "Runaway Bay, Gold Coast QLD"
      },
      service_radius_miles: 40,
      portfolio_images: ["https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"]
    },
    pricing: [
      { service: "cosmetic_tattoo", price_min: 350, price_max: 800, duration_minutes: 120 },
      { service: "threading", price_min: 20, price_max: 45, duration_minutes: 15 }
    ],
    average_rating: 4.92,
    total_reviews: 156,
    hearts: 650,
    is_gold_standard: true,
    is_top_5_percent: true
  },
  {
    stylist_id: "stylist_006",
    name: "Olivia Martinez",
    email: "olivia@onda.com",
    profile: {
      skills: ["haircut", "coloring", "styling"],
      bio: "Color correction specialist. Transforming hair with vibrant, long-lasting color.",
      service_area: {
        latitude: -27.8456,
        longitude: 153.3420,
        address: "Paradise Point, Gold Coast QLD"
      },
      service_radius_miles: 30,
      portfolio_images: ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"]
    },
    pricing: [
      { service: "haircut", price_min: 70, price_max: 130, duration_minutes: 50 },
      { service: "coloring", price_min: 180, price_max: 400, duration_minutes: 150 },
      { service: "styling", price_min: 90, price_max: 180, duration_minutes: 70 }
    ],
    average_rating: 4.78,
    total_reviews: 145,
    hearts: 550,
    is_gold_standard: false,
    is_top_5_percent: false
  },
  {
    stylist_id: "stylist_007",
    name: "Mia Anderson",
    email: "mia@onda.com",
    profile: {
      skills: ["facial", "waxing", "threading"],
      bio: "Holistic beauty therapist. Combining traditional techniques with modern skincare.",
      service_area: {
        latitude: -27.9168,
        longitude: 153.3890,
        address: "Biggera Waters, Gold Coast QLD"
      },
      service_radius_miles: 25,
      portfolio_images: ["https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"]
    },
    pricing: [
      { service: "facial", price_min: 95, price_max: 220, duration_minutes: 60 },
      { service: "waxing", price_min: 35, price_max: 90, duration_minutes: 35 },
      { service: "threading", price_min: 18, price_max: 40, duration_minutes: 15 }
    ],
    average_rating: 4.82,
    total_reviews: 167,
    hearts: 680,
    is_gold_standard: true,
    is_top_5_percent: false
  },
  {
    stylist_id: "stylist_008",
    name: "Zara Williams",
    email: "zara@onda.com",
    profile: {
      skills: ["nails", "cosmetic_tattoo"],
      bio: "Creative nail technician and PMU artist. Instagram-worthy designs every time.",
      service_area: {
        latitude: -27.4705,
        longitude: 153.0260,
        address: "South Brisbane QLD"
      },
      service_radius_miles: 35,
      portfolio_images: ["https://images.unsplash.com/photo-1596755389378-c31d21fd1273?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"]
    },
    pricing: [
      { service: "nails", price_min: 65, price_max: 180, duration_minutes: 75 },
      { service: "cosmetic_tattoo", price_min: 400, price_max: 900, duration_minutes: 150 }
    ],
    average_rating: 4.88,
    total_reviews: 203,
    hearts: 1500,
    is_gold_standard: true,
    is_top_5_percent: true
  },
  {
    stylist_id: "stylist_009",
    name: "Lily Park",
    email: "lily@onda.com",
    profile: {
      skills: ["haircut", "styling", "coloring"],
      bio: "K-beauty hair specialist. Expert in Asian hair textures and Korean styling trends.",
      service_area: {
        latitude: -27.5598,
        longitude: 153.0850,
        address: "Woolloongabba, Brisbane QLD"
      },
      service_radius_miles: 40,
      portfolio_images: ["https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"]
    },
    pricing: [
      { service: "haircut", price_min: 60, price_max: 110, duration_minutes: 45 },
      { service: "styling", price_min: 70, price_max: 140, duration_minutes: 55 },
      { service: "coloring", price_min: 140, price_max: 320, duration_minutes: 100 }
    ],
    average_rating: 4.75,
    total_reviews: 134,
    hearts: 480,
    is_gold_standard: false,
    is_top_5_percent: false
  },
  {
    stylist_id: "stylist_010",
    name: "Ruby Chen",
    email: "ruby@onda.com",
    profile: {
      skills: ["facial", "threading", "waxing"],
      bio: "Medical aesthetician. Specializing in acne treatment and skin rejuvenation.",
      service_area: {
        latitude: -27.6160,
        longitude: 153.1050,
        address: "Coorparoo, Brisbane QLD"
      },
      service_radius_miles: 30,
      portfolio_images: ["https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"]
    },
    pricing: [
      { service: "facial", price_min: 110, price_max: 260, duration_minutes: 70 },
      { service: "threading", price_min: 22, price_max: 48, duration_minutes: 18 },
      { service: "waxing", price_min: 42, price_max: 110, duration_minutes: 42 }
    ],
    average_rating: 4.91,
    total_reviews: 189,
    hearts: 1350,
    is_gold_standard: true,
    is_top_5_percent: true
  },
  {
    stylist_id: "stylist_011",
    name: "Hannah Wilson",
    email: "hannah@onda.com",
    profile: {
      skills: ["nails", "waxing"],
      bio: "Award-winning nail tech. Specializing in natural nail care and gel art.",
      service_area: {
        latitude: -27.9998,
        longitude: 153.3650,
        address: "Bundall, Gold Coast QLD"
      },
      service_radius_miles: 25,
      portfolio_images: ["https://images.unsplash.com/photo-1632345031435-8727f6897d53?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"]
    },
    pricing: [
      { service: "nails", price_min: 50, price_max: 130, duration_minutes: 55 },
      { service: "waxing", price_min: 38, price_max: 95, duration_minutes: 38 }
    ],
    average_rating: 4.79,
    total_reviews: 156,
    hearts: 520,
    is_gold_standard: false,
    is_top_5_percent: false
  },
  {
    stylist_id: "stylist_012",
    name: "Grace Taylor",
    email: "grace@onda.com",
    profile: {
      skills: ["haircut", "coloring", "styling", "cosmetic_tattoo"],
      bio: "Multi-talented beauty artist. From stunning hair transformations to perfect brows.",
      service_area: {
        latitude: -27.7820,
        longitude: 153.2680,
        address: "Nerang, Gold Coast QLD"
      },
      service_radius_miles: 45,
      portfolio_images: ["https://images.unsplash.com/photo-1560066984-138dadb4c035?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"]
    },
    pricing: [
      { service: "haircut", price_min: 55, price_max: 100, duration_minutes: 40 },
      { service: "coloring", price_min: 130, price_max: 300, duration_minutes: 90 },
      { service: "styling", price_min: 65, price_max: 120, duration_minutes: 50 },
      { service: "cosmetic_tattoo", price_min: 300, price_max: 700, duration_minutes: 100 }
    ],
    average_rating: 4.86,
    total_reviews: 278,
    hearts: 2650,
    is_gold_standard: true,
    is_top_5_percent: true
  }
];

export const SERVICE_LABELS = {
  haircut: "Haircut",
  coloring: "Coloring",
  styling: "Styling",
  facial: "Facial",
  nails: "Nails",
  threading: "Threading",
  waxing: "Waxing",
  cosmetic_tattoo: "Cosmetic Tattoo"
};

export const SERVICE_ICONS = {
  haircut: "✂️",
  coloring: "🎨",
  styling: "💇",
  facial: "✨",
  nails: "💅",
  threading: "🧵",
  waxing: "🕯️",
  cosmetic_tattoo: "🖊️"
};
