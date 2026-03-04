# Beyond Beauty - Product Requirements Document

## Overview
Beyond Beauty is a two-sided marketplace connecting clients with hairdressers and beauticians, similar to Uber. Elite beauty professionals bring sophistication to clients' locations with premium services, dynamic pricing, and exclusive travel discounts.

## Core User Personas
1. **Clients** - People seeking at-home beauty services
2. **Stylists** - Beauty professionals offering mobile services
3. **Admin** - Platform managers handling verification and finances

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Integrations**: Stripe (payments), Cloudflare Turnstile (bot protection), WebAuthn (passkeys)

---

## Implemented Features ✅

### Authentication & Security
- [x] Email/password registration and login
- [x] Cloudflare Turnstile bot protection
- [x] JWT-based session management
- [x] **WebAuthn/Passkeys** - Face ID, Touch ID, Windows Hello support (Jan 2026)
  - Passkey registration during signup
  - Passkey login option
  - Check for existing passkeys
- [x] **Settings Page** - Manage passkeys, notifications, account info

### Client Features
- [x] Client registration
- [x] Service selection page
- [x] Browse stylists with filters
- [x] Favorite stylists
- [x] Client dashboard

### Stylist Features
- [x] Stylist registration with service selection
- [x] Stylist profiles with skills and pricing
- [x] Stylist dashboard
- [x] Portfolio management (image upload)
- [x] Availability management

### Booking System
- [x] Booking creation
- [x] Booking status tracking
- [x] Quick rebook / "Book Again" feature (backend)

### UI/UX
- [x] Luxury dark theme with gold/amber accents
- [x] Landing page with rotating stylist carousel
- [x] Responsive design
- [x] Fixed: "Discover Artists" button visibility issue
- [x] Fixed: Browse page Select component error
- [x] **Footer** with social media links (Instagram, Facebook, Twitter, YouTube)
- [x] **Privacy Policy** page - Comprehensive data protection policy
- [x] **Terms & Conditions** page - Complete legal terms including:
  - Payment processing terms
  - Booking & cancellation policies
  - Refund policies
  - Liability disclaimers
  - Dispute resolution
- [x] **Google Maps Integration** on booking page:
  - Interactive map with dark theme styling
  - Distance & travel time calculation
  - Travel cost calculation ($1.50/mile after free 5 miles)
  - Geocoding for address lookup
  - Current location detection
  - Visual route display

### Platform
- [x] Real-time messaging (WebSockets)
- [x] Notification system
- [x] Ratings and reviews
- [x] Admin dashboard (scaffolded)
- [x] Concierge/feedback system (backend)

---

## In Progress / Pending 🔄

### P0 - Critical
- [ ] Complete "Book Again" feature (frontend integration)
- [ ] Full-stack testing pass

### P1 - High Priority
- [ ] Google OAuth integration
- [ ] Calendar component for availability
- [ ] Real-time map & distance tracking

### P2 - Medium Priority
- [ ] Push notifications (Firebase)
- [ ] Admin dashboard full functionality
- [ ] Stylist document upload & verification
- [ ] Cash-out feature with slide-to-confirm

### P3 - Future
- [ ] Concierge/feedback system UI
- [ ] Portfolio gallery pages (up to 1000 images)
- [ ] Gamification - travel discounts
- [ ] Refund Policy page
- [ ] Cookie Policy page

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Passkeys
- `POST /api/passkey/register/options` - Get WebAuthn registration options
- `POST /api/passkey/register/verify` - Verify and store passkey
- `POST /api/passkey/authenticate/options` - Get WebAuthn auth options
- `POST /api/passkey/authenticate/verify` - Verify passkey login
- `GET /api/passkey/check/{email}` - Check if user has passkeys

### Stylists
- `GET /api/stylists/` - List stylists
- `POST /api/stylists/register` - Stylist registration

### Bookings
- `POST /api/bookings/` - Create booking
- `GET /api/bookings/` - Get user bookings
- `POST /api/quick-rebook/` - Quick rebook

---

## Database Schema

### Users Collection
```javascript
{
  user_id: string,
  email: string (unique),
  name: string,
  hashed_password: string | null,
  role: "client" | "stylist",
  created_at: datetime,
  is_active: boolean,
  favorites: [stylist_id],
  passkeys: [{
    credential_id: string,
    public_key: string,
    sign_count: number,
    device_type: string,
    backed_up: boolean,
    transports: [string],
    created_at: datetime,
    last_used: datetime,
    name: string
  }]
}
```

---

## Key Files Reference
- `/app/backend/app/routes/passkeys.py` - Passkey authentication
- `/app/frontend/src/pages/LoginPage.js` - Login with passkey tabs
- `/app/frontend/src/pages/RegisterPage.js` - Registration with passkey option
- `/app/frontend/src/pages/SettingsPage.js` - User settings & passkey management
- `/app/frontend/src/pages/PrivacyPolicyPage.js` - Privacy policy
- `/app/frontend/src/pages/TermsPage.js` - Terms & conditions
- `/app/frontend/src/components/Footer.js` - Site footer with social links
- `/app/frontend/src/pages/LandingPage.js` - Landing page
- `/app/backend/server.py` - API routes setup

---

## Environment Variables

### Backend (.env)
- `MONGO_URL` - MongoDB connection
- `JWT_SECRET_KEY` - JWT signing key
- `WEBAUTHN_RP_ID` - WebAuthn relying party ID
- `WEBAUTHN_RP_NAME` - App name for WebAuthn
- `WEBAUTHN_ORIGIN` - Expected origin for WebAuthn

### Frontend (.env)
- `REACT_APP_BACKEND_URL` - API base URL
- `REACT_APP_TURNSTILE_SITEKEY` - Cloudflare Turnstile key

---

*Last Updated: January 2026*
