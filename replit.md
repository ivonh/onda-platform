# Onda Platform

## Overview
Onda is a beauty booking platform designed to connect clients with elite beauty professionals. It features a React-based frontend and a FastAPI backend with a PostgreSQL database. The platform aims to streamline the booking process, provide advanced search and filtering, facilitate secure payments, and offer tools for stylists to manage their profiles, availability, and bookings. Key capabilities include a calendar-aware AI chatbot, a comprehensive stylist approval and credential verification system, and robust payment and payout functionalities. The project's ambition is to become a leading platform for beauty services, emphasizing quality, convenience, and a seamless user experience.

## User Preferences
- I want iterative development.
- Ask me before making major changes.
- Provide detailed explanations for complex implementations.

## System Architecture
The Onda platform is built with a clear separation of concerns, featuring a React 19 frontend and a Python FastAPI backend.

### Frontend
- **Frameworks & Libraries:** React 19, CRACO, Tailwind CSS, Radix UI components, React Router DOM, Axios.
- **Styling:** Tailwind CSS for utility-first styling and Radix UI for accessible, unstyled components.
- **State Management:** Context API for managing global state, including user authentication and location.
- **UI/UX Decisions:**
    - Dedicated multi-page admin dashboard with sidebar navigation.
    - Floating ChatWidget for AI concierge access from any page.
    - SwipeToPayButton for confirming payments to prevent accidental transactions.
    - Responsive design for optimal viewing across devices.
    - Branded styling consistent with the "Onda" rebrand across all components and templates.
    - Interactive maps for location-based features (stylist/client markers, route calculation).
    - Dynamic forms for stylist profiles, credentials, and booking details.
    - **Button Effects:** Shimmer sweep on hover (CSS `::before` gradient), fireworks particle burst on click (`useFireworks` hook), all pure CSS + vanilla JS with no extra dependencies.
    - **Onda Glow Pulse:** Continuous `drop-shadow` animation on "Onda" brand text (works with `bg-clip-text` gradient). Applied in Navigation and LandingPage.
    - **TextShimmer & SplashScreen:** Lightweight CSS-only text shimmer and branded splash screen for mobile app reference.
    - **Scroll Animations:** `useScrollAnimation` hook (Intersection Observer) for fade-up/down/left/right/zoom-in effects, `useParallax` for parallax scrolling, `useCountUp` for animated stat counters. All with IO fallback guards.
    - **Cinematic Landing Page:** Full-bleed hero with parallax background, animated stat counters, editorial image grid, scroll-triggered section reveals, testimonial section.
    - **Scroll-Aware Navigation:** Fixed navbar transitions from transparent (on landing) to glass-blur on scroll. Other pages get automatic top padding.
    - **TikTok Social Integration:** TikTok icon (custom SVG) added as primary social link in Footer alongside Instagram, Facebook, Twitter, YouTube.
    - **Editorial Footer:** Redesigned with gradient background, radial glow accent, and 12-column grid layout.
    - **Hearts System:** All rating stars replaced with Zelda-style heart SVGs across platform. Minimum 3 filled hearts for all stylists. Hearts computed as `total_ratings * average_rating`, displayed via `Math.max(3, hearts/500)` scale (0-5).
    - **Tier Badges:** Gold Standard (2500+ hearts, crown), Executive (1000+, diamond), Rising Star (250+, star). Proper distribution across seed data.
    - **Browse Page Data Mapping:** Search API results mapped to StylistCard format with hearts, profile structure. Fallback path also normalized.

### Backend
- **Framework:** FastAPI for high-performance API development.
- **Database:** PostgreSQL with async SQLAlchemy (asyncpg driver) for asynchronous ORM operations.
- **Authentication:** JWT for secure user authentication, including "Remember me," "Forgot Password," and Passkey sign-in.
- **Payment Processing:** Stripe integration for secure payments, saved cards, and automated payouts with commission tracking.
- **Core Features:**
    - **User Management:** Client and stylist accounts, role-based access control.
    - **Booking System:** Appointment scheduling, double-booking prevention, configurable cancellation policies.
    - **Stylist Management:** Profiles, credentials verification, portfolio photos, availability settings, time blocking.
    - **AI Integration:** OpenAI-powered chatbot with function calling for real-time availability and service queries.
    - **Notifications:** In-app, email, and push notification systems for booking confirmations, reminders, and platform updates.
    - **Search & Discovery:** Advanced search filters (service, price, rating, distance, availability).
    - **Admin Tools:** Comprehensive dashboard for managing users, credentials, photos, support tickets, and communications.
    - **Post-Appointment Rating System:** 5-question Onda rating flow (Before/After photos, stylist behavior, would book again, why chose Onda, social share prompt). Auto-generates 15% discount coupon codes (ONDA-XXXXXX-15) when clients consent to photo marketing.
    - **Coupon System:** CouponCode model with generation, validation, redemption, and marketing card endpoints. Coupons linked to Before/After photos for social proof marketing.
    - **Geolocation:** Browser geolocation with reverse geocoding, falling back to a default location.
    - **Security:** Rate limiting, input validation (password strength, phone format), webhook signature verification.
    - **Deployment:** Autoscale configuration with backend serving static frontend files in production.

### Data Models
Key database tables managed via SQLAlchemy models include: `users`, `stylists`, `stylist_pricing`, `bookings`, `availability`, `time_blocks`, `messages`, `notifications`, `ratings`, `favorites`, `booking_feedback`, `booking_completions`, `StylistCredential`, `PortfolioPhoto`, `PasswordResetToken`, `SupportTicket`, `StylistPayoutSettings`, `PayoutTransaction`, `PlatformSettings`.

### API Structure
Organized into logical routes:
- `/api/auth/`
- `/api/stylists/`
- `/api/bookings/`
- `/api/availability/`
- `/api/payments/`
- `/api/ratings/`
- `/api/favorites/`
- `/api/messages/`
- `/api/notifications/`
- `/api/admin/`
- `/api/tickets/`
- `/api/credentials/`
- `/api/chat/`
- `/api/payouts/`
- `/api/search/`
- `/api/coupons/`
- `/api/feedback/`

## GitHub Repository
- **Web Platform:** https://github.com/ivonh/onda-platform (full codebase)
- **Mobile Strategy:** PWA for Android (installable from browser), potential React Native fork later

## Progressive Web App (PWA)
- **Manifest:** `frontend/public/manifest.json` — app name, icons, theme colors, standalone display mode
- **Service Worker:** `frontend/public/service-worker.js` — network-first caching for API calls, cache-first fallback for static assets, offline support, push notification handling
- **Registration:** `frontend/src/serviceWorkerRegistration.js` — auto-registers SW, handles updates with page reload
- **Icons:** `frontend/public/icons/` — PNG icons at 72, 96, 128, 144, 152, 192, 384, 512px with Onda branding (gold "O" on dark background)
- **Install:** Users on Android Chrome can "Add to Home Screen" for native-like app experience

## Dev Environment
- **Frontend Dev Server:** Port 5000 (CRACO/webpack dev server)
- **Backend API Server:** Port 8000 (FastAPI/Uvicorn)
- **API Proxy:** `craco.config.js` proxies `/api/*` from port 5000 → port 8000
- **API Client:** `api.js` uses `baseURL: '/api'` (relative). All route calls omit `/api` prefix since it's in baseURL.

## External Dependencies
- **PostgreSQL:** Primary database.
- **Stripe:** Payment processing, saved cards, and payout management. Integrated via Replit's connection API.
- **OpenAI:** Powers the AI Beauty Concierge chatbot through Replit AI Integrations.
- **GitHub:** Connected via Replit integration for repository management.
- **Google Maps JavaScript API & Places API:** For address geocoding, route calculation, and interactive map displays (requires `REACT_APP_GOOGLE_MAPS_API_KEY`).
- **Firebase:** For push notifications.
- **Twilio/SendGrid (Optional):** For SMS/email notifications.