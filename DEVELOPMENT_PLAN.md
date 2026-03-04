# Onda Platform — Development Plan

## Overview
This document outlines the phased development plan for transforming Onda into a world-class beauty booking platform. Each phase builds on the previous one, adding layers of visual polish, engagement features, and commerce tools.

---

## Phase 1: Visual Makeover & Foundation
**Status:** In Progress
**Goal:** Transform the landing page and core layouts into a premium, editorial-style experience that reflects the luxury beauty brand.

### Features
- **Hero Section Redesign** — Full-width cinematic hero with parallax scrolling, animated text reveals, and multiple hero images
- **Scroll-Triggered Animations** — Intersection Observer-based fade-in, slide-up, and scale animations across all sections
- **Elite Artists Showcase** — Image-forward grid layout replacing basic carousel, with premium hover effects and editorial styling
- **Navigation Enhancement** — Scroll-aware navbar that transitions from transparent to solid with smooth backdrop blur
- **Footer Redesign** — Visual upgrade with TikTok social integration alongside Instagram, Facebook, Twitter, YouTube
- **Editorial Typography** — Enhanced use of Cormorant Garamond + Montserrat with dramatic sizing and spacing
- **Stats/Social Proof Section** — Animated counters showing platform metrics (artists, bookings, cities served)
- **Testimonials Section** — Client testimonials with photo and rating display

### Technical Approach
- Pure CSS animations + Tailwind utility classes (no extra animation libraries)
- Custom `useScrollAnimation` hook using Intersection Observer API
- CSS `scroll-behavior: smooth` and `will-change` for GPU-optimized transitions
- TikTok icon via custom SVG (not available in lucide-react)

---

## Phase 2: Content & Social
**Status:** Planned
**Goal:** Enable rich content creation and social integration for stylists and the platform.

### Features
- **Before & After Galleries** — Stylists upload transformation photos with side-by-side comparison slider
- **Video Portfolios** — Short video clips on stylist profiles (upload + embed support)
- **TikTok Integration** — Stylists link their TikTok profile, embed feed on their Onda profile
- **Blog / Inspiration Space** — Content hub where stylists and partners publish articles, trends, tips
- **Mood Board / Inspiration Feed** — Pinterest-style visual browsing with save/bookmark functionality

### Technical Approach
- Backend: New models for `BlogPost`, `BeforeAfterPhoto`, `VideoPortfolio`, `MoodBoardItem`
- Frontend: Image comparison slider component, video player, blog layout with rich text
- TikTok oEmbed API for embedding content
- Image upload via presigned URLs or direct upload
- Rich text editor for blog posts (lightweight, e.g., Tiptap or similar)

### Dependencies
- Phase 1 (visual foundation must be in place)

---

## Phase 3: Engagement & Discovery
**Status:** Planned
**Goal:** Help clients discover the right stylist and build engagement through interactive features.

### Features
- **Style Quiz & Recommendation Engine** — Interactive multi-step quiz matching clients to stylists based on aesthetic preferences, hair type, desired look, budget
- **Trending Near You** — Location-based trending services and popular stylists
- **Stylist Badges** — Visual trust signals: "Top Rated," "Rising Star," "Onda Certified," "Gold Standard"
- **Enhanced Search Filters** — Filter by style preference, availability, badge level

### Technical Approach
- Backend: Quiz results model, recommendation algorithm (weighted scoring based on quiz answers + stylist attributes)
- Frontend: Multi-step animated quiz flow with progress indicator
- Badge system: Backend enum + frontend badge component library
- Geolocation-enhanced trending algorithm

### Dependencies
- Phase 1 (visual foundation)
- Phase 2 (content for recommendation context)

---

## Phase 4: Post-Service & Reviews
**Status:** Planned
**Goal:** Close the feedback loop after services are completed, building trust and quality assurance.

### Features
- **Post-Completion Client Survey** — Automated survey sent after booking marked complete (rating, feedback, photo upload, would-you-rebook)
- **Verified Reviews with Photos** — Clients upload result photos alongside written reviews
- **Product Recommendations** — Stylists can recommend products after service (potential future revenue share)
- **Client History for Stylists** — View past services, preferences, and notes per client

### Technical Approach
- Backend: `ServiceSurvey` model with questions, `ReviewPhoto` model, `ProductRecommendation` model
- Survey auto-triggered via booking completion webhook/event
- Email notification with survey link
- Photo upload and moderation pipeline
- Frontend: Survey form component, photo upload with preview, product card component

### Dependencies
- Phase 1 (visual foundation)
- Existing booking completion flow

---

## Phase 5: Commerce & Loyalty
**Status:** Planned
**Goal:** Drive repeat business and expand revenue through commerce features.

### Features
- **Gift Cards & Gift Booking** — Purchase digital gift cards, book services as gifts for others
- **Loyalty & Rewards Program** — Points earned per booking, referral, and review; redeemable for discounts or perks
- **Waitlist Management** — Join waitlist for fully-booked popular stylists, auto-notify when slot opens
- **Referral Program** — Share referral codes, earn rewards when friends book

### Technical Approach
- Backend: `GiftCard`, `LoyaltyPoints`, `LoyaltyTransaction`, `Waitlist`, `Referral` models
- Stripe integration for gift card purchases
- Points calculation engine (configurable earning/redemption rates)
- Waitlist: automatic slot detection + notification when cancellation occurs
- Frontend: Gift card purchase flow, loyalty dashboard, waitlist UI, referral sharing

### Dependencies
- Phase 1 (visual foundation)
- Existing Stripe payment integration
- Existing notification system

---

## Cross-Phase Notes

### Design Principles
- **Mobile-first** — All features designed for mobile viewport first, enhanced for desktop
- **Zero extra animation libraries** — CSS animations + vanilla JS only (for React Native team reference)
- **Tailwind-first** — Utility classes preferred over custom CSS where possible
- **Performance** — GPU-friendly animations (transform, opacity, filter), lazy loading for images/video
- **Accessibility** — ARIA labels, keyboard navigation, reduced-motion media queries

### Social Integrations
- **TikTok** — Primary social channel (profile links, content embeds, footer icon)
- **Instagram** — Profile links, potential future feed embed
- **Facebook** — Profile link, share functionality
- **YouTube** — Video portfolio cross-posting

### Brand Colors (Reference)
- Primary: `hsl(25, 100%, 70%)` — Warm gold/amber
- Secondary: `hsl(40, 60%, 80%)` — Soft champagne
- Background: `hsl(0, 0%, 8%)` — Near black
- Foreground: `hsl(40, 10%, 96%)` — Warm white
- Fonts: Cormorant Garamond (headings), Montserrat (body)
