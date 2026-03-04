# Onda - React Native Mobile App API Documentation

> **Last Updated:** February 2026
> **Backend:** FastAPI (Python) + PostgreSQL
> **Base URL:** `https://your-deployed-domain.com/api`
> **Currency:** AUD (Australian Dollars)
> **Region:** Australia / New Zealand

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Authentication](#2-authentication)
3. [Users & Profiles](#3-users--profiles)
4. [Stylists](#4-stylists)
5. [Bookings](#5-bookings)
6. [Payments (Stripe)](#6-payments-stripe)
7. [Availability & Calendar](#7-availability--calendar)
8. [Ratings & Reviews](#8-ratings--reviews)
9. [Favorites](#9-favorites)
10. [Messaging](#10-messaging)
11. [Notifications](#11-notifications)
12. [AI Chat Concierge](#12-ai-chat-concierge)
13. [Search & Discovery](#13-search--discovery)
14. [Loyalty Program](#14-loyalty-program)
15. [Cancellation Policies](#15-cancellation-policies)
16. [Credentials & Portfolio (Stylist)](#16-credentials--portfolio-stylist)
17. [Payouts (Stylist)](#17-payouts-stylist)
18. [Analytics (Stylist)](#18-analytics-stylist)
19. [Admin](#19-admin)
20. [Data Models Reference](#20-data-models-reference)
21. [Error Handling](#21-error-handling)
22. [Business Logic & Rules](#22-business-logic--rules)
23. [Mobile-Specific Notes](#23-mobile-specific-notes)

---

## 1. Getting Started

### Base URL
All API endpoints are prefixed with `/api`. For example:
```
https://your-domain.com/api/auth/login
```

### Headers
All requests should include:
```
Content-Type: application/json
```

Authenticated requests must include:
```
Authorization: Bearer <access_token>
```

### Authentication Flow Summary
1. User registers or logs in → receives a JWT `access_token`
2. Store the token securely (e.g., `expo-secure-store` or `react-native-keychain`)
3. Send the token in every authenticated request via the `Authorization` header
4. Tokens expire after **7 days** (10,080 minutes) by default

---

## 2. Authentication

### POST `/auth/register`
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "MySecure1Pass",
  "name": "Jane Doe",
  "role": "client",
  "phone": "+61412345678"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

**Phone Format:**
- Australian format: `+61 4XX XXX XXX`
- New Zealand format: `+64 2X XXX XXXX`
- Validated and stored in E.164 format

**Roles:**
- `"client"` — Default. Can book stylists, leave reviews, message.
- `"stylist"` — Can also be set, but prefer the dedicated stylist registration endpoint (see [Stylists](#4-stylists)).

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "uuid-string",
    "email": "user@example.com",
    "name": "Jane Doe",
    "role": "client",
    "created_at": "2026-02-07T10:00:00Z"
  }
}
```

**Errors:**
- `409` — Email already registered
- `422` — Validation error (weak password, invalid phone)

---

### POST `/auth/login`
Log in with existing credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "MySecure1Pass"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "user_id": "uuid-string",
    "email": "user@example.com",
    "name": "Jane Doe",
    "role": "client",
    "created_at": "2026-02-07T10:00:00Z"
  }
}
```

**Errors:**
- `401` — Invalid credentials

---

### POST `/auth/forgot-password`
Request a password reset link sent via email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

**Notes:**
- Always returns 200 (does not reveal whether email exists)
- Reset link expires in 1 hour
- Link opens the reset password page with a token query parameter

---

### POST `/auth/reset-password`
Reset password using the token from the email link.

**Request Body:**
```json
{
  "token": "reset-token-from-email-link",
  "new_password": "NewSecure1Pass"
}
```

**Response (200):**
```json
{
  "message": "Password has been reset successfully. You can now sign in with your new password."
}
```

**Errors:**
- `400` — Invalid or expired reset link
- `422` — Password does not meet strength requirements

---

### GET `/auth/me`
Get the currently authenticated user's profile.

**Auth Required:** Yes

**Response (200):**
```json
{
  "user_id": "uuid-string",
  "email": "user@example.com",
  "name": "Jane Doe",
  "role": "client",
  "phone": "+61412345678",
  "profile_image": "https://...",
  "created_at": "2026-02-07T10:00:00Z"
}
```

---

## 3. Users & Profiles

### JWT Token Structure
The JWT payload contains:
```json
{
  "sub": "user_id (UUID string)",
  "role": "client | stylist",
  "exp": 1738900000
}
```

### User Roles & Permissions
| Feature | Client | Stylist | Admin |
|---------|--------|---------|-------|
| Browse/search stylists | Yes | Yes | Yes |
| Book appointments | Yes | No | No |
| Leave ratings | Yes | No | No |
| Set availability | No | Yes | No |
| View earnings | No | Yes | No |
| Manage credentials | No | Yes | No |
| Admin dashboard | No | No | Yes |
| Approve stylists | No | No | Yes |

Admin is determined by email address (configured server-side), not by role field.

---

## 4. Stylists

### POST `/stylists/register`
Register a new stylist with profile and pricing. Creates both a user account and a stylist profile.

**Request Body:**
```json
{
  "email": "stylist@example.com",
  "password": "SecurePass1",
  "name": "Sarah Smith",
  "phone": "+61498765432",
  "profile": {
    "skills": ["Hair Styling", "Makeup", "Nails"],
    "bio": "10 years of experience in bridal and editorial styling.",
    "years_experience": 10,
    "service_area": {
      "latitude": -27.4705,
      "longitude": 153.0260,
      "address": "Brisbane, QLD"
    },
    "service_radius_miles": 15.0,
    "portfolio_images": ["https://...image1.jpg"]
  },
  "pricing": [
    {
      "service": "Haircut",
      "price_min": 60.0,
      "price_max": 120.0,
      "duration_minutes": 45
    },
    {
      "service": "Full Makeup",
      "price_min": 100.0,
      "price_max": 200.0,
      "duration_minutes": 60
    }
  ]
}
```

**Important:** New stylists have `approval_status: "pending"` and are **not visible** to clients in search results until an admin approves them.

**Response (201):**
```json
{
  "access_token": "eyJhbGci...",
  "user": { ... },
  "stylist_id": "uuid-string",
  "message": "Stylist registered successfully. Your profile is pending approval."
}
```

---

### GET `/stylists/search`
Search for approved stylists.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `service` | string | - | Filter by service/skill name (e.g., "Haircut") |
| `lat` | float | - | Client latitude for distance calculation |
| `lng` | float | - | Client longitude for distance calculation |
| `max_distance` | float | 25.0 | Maximum distance in miles |
| `min_price` | float | - | Minimum average price filter |
| `max_price` | float | - | Maximum average price filter |
| `limit` | int | 20 | Max results to return |

**Response (200):**
```json
[
  {
    "stylist_id": "uuid",
    "name": "Sarah Smith",
    "bio": "...",
    "skills": ["Hair Styling", "Makeup"],
    "years_experience": 10,
    "average_rating": 4.8,
    "total_ratings": 42,
    "hearts": 201.6,
    "service_address": "Brisbane, QLD",
    "distance_miles": 3.2,
    "pricing": [
      {
        "service": "Haircut",
        "price_min": 60.0,
        "price_max": 120.0,
        "duration_minutes": 45
      }
    ],
    "portfolio_images": ["https://..."],
    "is_verified": true,
    "verified_credentials": [
      { "credential_type": "hairdressing_certificate", "credential_name": "Cert III Hairdressing" }
    ]
  }
]
```

---

### GET `/stylists/top`
Get top-rated stylists for the homepage/discover page.

**Response (200):** Array of stylist objects (same format as search).

---

### GET `/stylists/{stylist_id}`
Get a specific stylist's full profile.

**Response (200):** Full stylist object with pricing, portfolio, credentials, and reviews.

---

### GET `/stylists/profile/me`
Get the current stylist's own profile (auth required, stylist role).

---

## 5. Bookings

### POST `/bookings/estimate`
Get a price estimate before booking.

**Auth Required:** Yes

**Request Body:**
```json
{
  "stylist_id": "uuid",
  "services": ["Haircut", "Hair Color"],
  "client_location": {
    "latitude": -27.47,
    "longitude": 153.02,
    "address": "123 Main St, Brisbane"
  },
  "travel_mode": "stylist_travels"
}
```

**Travel Modes:**
- `"stylist_travels"` — Stylist comes to client. Travel fee applies (see pricing formula below).
- `"client_travels"` — Client goes to stylist. No travel fee.
- `"own_arrangement"` — Client arranges own travel and provides a meeting address. No travel fee. Requires `meeting_location` with an address.

**Response (200):**
```json
{
  "stylist_id": "uuid",
  "distance_miles": 8.5,
  "service_price": 180.0,
  "travel_cost": 19.88,
  "platform_fee": 27.00,
  "platform_fee_percent": 15.0,
  "stylist_earnings": 172.88,
  "total_price": 199.88,
  "estimated_duration_minutes": 105,
  "services": ["Haircut", "Hair Color"],
  "travel_mode": "stylist_travels"
}
```

---

### POST `/bookings/create`
Create a new booking.

**Auth Required:** Yes (client role)

**Request Body:**
```json
{
  "stylist_id": "uuid",
  "services": ["Haircut"],
  "preferred_datetime": "2026-02-15T14:00:00Z",
  "client_location": {
    "latitude": -27.47,
    "longitude": 153.02,
    "address": "123 Main St, Brisbane"
  },
  "travel_mode": "stylist_travels",
  "meeting_location": null,
  "notes": "Please bring round brush"
}
```

For `"own_arrangement"` travel mode, `meeting_location` is required:
```json
{
  "travel_mode": "own_arrangement",
  "meeting_location": {
    "latitude": -27.47,
    "longitude": 153.02,
    "address": "456 Queen Street, Brisbane"
  }
}
```

**Response (201):**
```json
{
  "booking_id": "uuid",
  "status": "pending",
  "payment_status": "pending",
  "scheduled_datetime": "2026-02-15T14:00:00Z",
  "total_price": 92.00,
  "service_price": 80.00,
  "travel_cost": 12.00,
  "platform_fee": 12.00,
  "stylist_earnings": 68.00
}
```

**Errors:**
- `409` — Time slot already booked / stylist unavailable
- `404` — Stylist not found

---

### GET `/bookings/my-bookings`
Get all bookings for the authenticated user (works for both clients and stylists).

**Auth Required:** Yes

**Response (200):** Array of booking objects.

---

### PUT `/bookings/{booking_id}/status`
Update a booking's status (stylist or admin).

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Valid Statuses:** `pending`, `confirmed`, `in_progress`, `completed`, `cancelled`

---

### POST `/bookings/{booking_id}/cancel`
Cancel a booking. Cancellation fees may apply based on the stylist's cancellation policy.

**Auth Required:** Yes

---

### POST `/bookings/{booking_id}/extend`
Request to extend a booking's duration.

---

## 6. Payments (Stripe)

### Payment Flow for Mobile

The payment flow uses **Stripe Checkout Sessions** with redirect URLs. For React Native, you have two integration options:

#### Option A: WebView-Based Checkout (Recommended)
1. Call `POST /payments/create-checkout` to get a Stripe checkout URL
2. Open the URL in an in-app WebView (or external browser via `Linking.openURL`)
3. After payment, Stripe redirects to your success/cancel URL
4. Intercept the redirect URL in the WebView to detect completion
5. The webhook updates the booking status server-side

#### Option B: Saved Card (Returning Customers)
1. Call `GET /payments/saved-cards` to list saved payment methods
2. Call `POST /payments/charge-saved-card` to charge a saved card directly
3. No redirect needed — payment completes immediately

---

### GET `/payments/config`
Get Stripe publishable key for client-side initialization.

**Response (200):**
```json
{
  "publishable_key": "pk_live_..."
}
```

---

### POST `/payments/create-checkout`
Create a Stripe checkout session for a booking.

**Auth Required:** Yes

**Query Parameter:**
| Param | Type | Description |
|-------|------|-------------|
| `booking_id` | string | The booking ID to pay for |

Example: `POST /api/payments/create-checkout?booking_id=uuid-string`

**Response (200):**
```json
{
  "checkout_url": "https://checkout.stripe.com/pay/cs_...",
  "session_id": "cs_..."
}
```

**Mobile Implementation Notes:**
- The checkout URL opens a Stripe-hosted payment page
- Success redirect: `https://your-domain.com/payment-success?session_id=cs_...`
- Cancel redirect: `https://your-domain.com/payment-cancelled`
- In React Native, intercept these URLs in a WebView's `onNavigationStateChange`
- Cards are automatically saved for future use (via `setup_future_usage`)

---

### GET `/payments/saved-cards`
List the user's saved payment methods.

**Auth Required:** Yes

**Response (200):**
```json
{
  "cards": [
    {
      "id": "pm_1234567890",
      "brand": "visa",
      "last4": "4242",
      "exp_month": 12,
      "exp_year": 2028
    }
  ]
}
```

---

### DELETE `/payments/saved-cards/{payment_method_id}`
Remove a saved card.

**Auth Required:** Yes

**Response (200):**
```json
{
  "status": "removed"
}
```

---

### POST `/payments/charge-saved-card`
Pay for a booking using a previously saved card.

**Auth Required:** Yes

**Request Body:**
```json
{
  "booking_id": "uuid",
  "payment_method_id": "pm_1234567890"
}
```

**Response (200):**
```json
{
  "status": "succeeded",
  "booking_id": "uuid"
}
```

**Possible Statuses:**
- `"succeeded"` — Payment completed
- `"requires_action"` — 3D Secure authentication needed (returns `client_secret`)
- Other Stripe statuses as strings

---

### POST `/payments/tip`
Send a tip to a stylist after a completed booking.

**Auth Required:** Yes

**Request Body:**
```json
{
  "booking_id": "uuid",
  "amount": 15.00
}
```

---

### GET `/payments/status/{session_id}`
Check the status of a Stripe checkout session.

**Response (200):**
```json
{
  "status": "complete",
  "payment_status": "paid",
  "booking_id": "uuid"
}
```

---

### POST `/payments/webhook`
Stripe webhook endpoint (server-to-server only). Do not call from mobile.

---

## 7. Availability & Calendar

### POST `/availability/set`
Set weekly working hours (stylist only).

**Auth Required:** Yes (stylist)

**Request Body:**
```json
{
  "slots": [
    {
      "day_of_week": 0,
      "start_time": "09:00",
      "end_time": "17:00",
      "is_available": true
    },
    {
      "day_of_week": 1,
      "start_time": "10:00",
      "end_time": "18:00",
      "is_available": true
    },
    {
      "day_of_week": 6,
      "start_time": "00:00",
      "end_time": "00:00",
      "is_available": false
    }
  ]
}
```

**Day of Week:** 0 = Monday, 1 = Tuesday, ..., 6 = Sunday

---

### POST `/availability/block-time`
Block a specific time period (e.g., holiday, personal time).

**Auth Required:** Yes (stylist)

**Request Body:**
```json
{
  "start_datetime": "2026-02-20T09:00:00Z",
  "end_datetime": "2026-02-20T17:00:00Z",
  "reason": "Personal appointment"
}
```

---

### DELETE `/availability/block-time/{block_id}`
Remove a time block.

---

### GET `/availability/stylist/{stylist_id}`
Get a stylist's availability (public, no auth required).

**Response (200):**
```json
{
  "working_hours": [
    { "day_of_week": 0, "start_time": "09:00", "end_time": "17:00", "is_available": true }
  ],
  "blocked_times": [
    {
      "block_id": "uuid",
      "start_datetime": "2026-02-20T09:00:00Z",
      "end_datetime": "2026-02-20T17:00:00Z",
      "reason": "Holiday"
    }
  ],
  "booked_slots": [
    {
      "start": "2026-02-15T14:00:00Z",
      "end": "2026-02-15T15:00:00Z"
    }
  ]
}
```

---

### GET `/availability/my-calendar`
Get the stylist's own calendar view with full booking details.

**Auth Required:** Yes (stylist)

---

## 8. Ratings & Reviews

### POST `/ratings/`
Leave a rating for a completed booking.

**Auth Required:** Yes (client)

**Request Body:**
```json
{
  "booking_id": "uuid",
  "rating": 5,
  "feedback": "Absolutely amazing haircut! Best I've ever had."
}
```

**Validation:**
- Rating must be between 1 and 5
- Only the client who made the booking can leave a review
- One review per booking

---

### GET `/ratings/stylist/{stylist_id}`
Get all ratings for a stylist (public).

**Response (200):**
```json
[
  {
    "rating_id": "uuid",
    "rating": 5,
    "feedback": "Amazing work!",
    "user_name": "Jane D.",
    "created_at": "2026-02-07T10:00:00Z"
  }
]
```

---

### Review Photos

### POST `/review-photos/upload`
Upload before/after photos with a review.

**Auth Required:** Yes

**Request Body:**
```json
{
  "rating_id": "uuid",
  "photo_url": "https://...",
  "photo_type": "before_after",
  "caption": "Before and after my colour treatment"
}
```

### GET `/review-photos/rating/{rating_id}`
Get photos for a specific review.

---

## 9. Favorites

### POST `/favorites/add/{stylist_id}`
Save a stylist as a favorite.

**Auth Required:** Yes

---

### DELETE `/favorites/remove/{stylist_id}`
Remove a stylist from favorites.

**Auth Required:** Yes

---

### GET `/favorites/my-favorites`
Get all favorite stylists.

**Auth Required:** Yes

---

### GET `/favorites/check/{stylist_id}`
Check if a specific stylist is favorited.

**Auth Required:** Yes

**Response (200):**
```json
{
  "is_favorite": true
}
```

---

## 10. Messaging

### POST `/messages/send`
Send a message to another user.

**Auth Required:** Yes

**Request Body:**
```json
{
  "receiver_id": "uuid",
  "message": "Hi! I have a question about the haircut service.",
  "conversation_id": null
}
```

Set `conversation_id` to `null` for a new conversation, or provide an existing ID to continue a thread.

---

### GET `/messages/conversations`
Get all conversations for the current user.

**Auth Required:** Yes

**Response (200):**
```json
[
  {
    "conversation_id": "uuid",
    "other_user": {
      "user_id": "uuid",
      "name": "Sarah Smith",
      "profile_image": "https://..."
    },
    "last_message": "Thanks for booking!",
    "last_message_at": "2026-02-07T10:00:00Z",
    "unread_count": 2
  }
]
```

---

### GET `/messages/conversation/{conversation_id}`
Get all messages in a conversation.

**Auth Required:** Yes

---

## 11. Notifications

### POST `/notifications/register-device`
Register a device for push notifications (Firebase Cloud Messaging).

**Auth Required:** Yes

**Request Body:**
```json
{
  "fcm_token": "your-firebase-cloud-messaging-token"
}
```

**React Native Implementation:**
```javascript
// Using @react-native-firebase/messaging
import messaging from '@react-native-firebase/messaging';

const token = await messaging().getToken();
await api.post('/notifications/register-device', { fcm_token: token });

// Listen for token refresh
messaging().onTokenRefresh(async (newToken) => {
  await api.post('/notifications/register-device', { fcm_token: newToken });
});
```

---

### GET `/notifications/`
Get all notifications for the current user.

**Auth Required:** Yes

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | int | 50 | Max notifications to return |

**Response (200):**
```json
[
  {
    "notification_id": "uuid",
    "title": "Booking Confirmed",
    "message": "Your haircut with Sarah has been confirmed for Feb 15 at 2:00 PM",
    "data": { "booking_id": "uuid", "type": "booking_confirmed" },
    "is_read": false,
    "created_at": "2026-02-07T10:00:00Z"
  }
]
```

---

### PUT `/notifications/{notification_id}/read`
Mark a notification as read.

**Auth Required:** Yes

---

## 12. AI Chat Concierge

### POST `/chat/`
Send a message to the AI beauty concierge. The chatbot can search for available stylists, check schedules, and provide pricing info using real-time data.

**Auth Required:** Optional (provides personalized context when logged in)

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "I need a haircut at 2pm today, who's available?"
    }
  ],
  "context": null,
  "user_context": {
    "latitude": -27.47,
    "longitude": 153.02,
    "suburb": "South Brisbane"
  }
}
```

**Message History:**
Send the full conversation history (up to 10 messages). Each message has:
- `role`: `"user"` or `"assistant"`
- `content`: The message text

**Response (200):**
```json
{
  "message": "I found 3 stylists available for a haircut at 2:00 PM today:\n\n1. **Sarah Smith** - ★ 4.9 (42 reviews) - $80 - 45 min\n2. ...",
  "success": true,
  "booking_suggestion": null
}
```

**Rate Limit:** 20 requests per minute per user.

---

## 13. Search & Discovery

### GET `/search/stylists`
Advanced search with multiple filters.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `service` | string | Service type filter |
| `min_price` | float | Minimum price |
| `max_price` | float | Maximum price |
| `min_rating` | float | Minimum rating (1-5) |
| `lat` | float | Client latitude |
| `lng` | float | Client longitude |
| `radius` | float | Distance radius in miles |
| `available_date` | string | Date to check availability (YYYY-MM-DD) |
| `available_time` | string | Time to check availability (HH:MM) |

---

### GET `/search/services`
Get a list of all available service types across the platform.

---

### GET `/search/price-range`
Get the min/max price range for a specific service.

---

## 14. Loyalty Program

### GET `/loyalty/`
Get the current user's loyalty status.

**Auth Required:** Yes

**Response (200):**
```json
{
  "total_points": 1250,
  "lifetime_points": 3500,
  "tier": "silver",
  "tier_discount_percent": 5,
  "points_to_next_tier": 1500,
  "next_tier": "gold",
  "referral_code": "AB12CD34"
}
```

**Tier System:**
| Tier | Points Required | Discount |
|------|----------------|----------|
| Bronze | 0 | 0% |
| Silver | 1,000 | 5% |
| Gold | 5,000 | 10% |
| Platinum | 15,000 | 15% |

**Points Earning:** 10 points per $1 AUD spent.

---

### GET `/loyalty/transactions`
Get loyalty point transaction history.

**Auth Required:** Yes

**Query Parameters:**
| Param | Type | Default |
|-------|------|---------|
| `limit` | int | 20 |

---

### POST `/loyalty/redeem`
Redeem loyalty points for a discount.

**Auth Required:** Yes

**Request Body:**
```json
{
  "points": 500
}
```

**Response (200):**
```json
{
  "success": true,
  "points_redeemed": 500,
  "discount_value": 5.00,
  "remaining_points": 750
}
```

**Conversion:** 100 points = $1.00 AUD discount.

---

### POST `/loyalty/apply-referral/{code}`
Apply a referral code (one-time use per user).

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "message": "Referral code applied! You earned 250 bonus points.",
  "points_earned": 250
}
```

---

## 15. Cancellation Policies

### GET `/cancellation/policy/{stylist_id}`
Get a stylist's cancellation policy.

**Response (200):**
```json
{
  "policy_id": "uuid",
  "free_cancellation_hours": 24,
  "late_cancellation_fee_percent": 50.0,
  "no_show_fee_percent": 100.0,
  "policy_description": "Free cancellation up to 24 hours before your appointment. 50% fee for late cancellations."
}
```

If the stylist hasn't set a custom policy, default values are returned.

---

### GET `/cancellation/calculate-fee/{booking_id}`
Calculate the cancellation fee for a specific booking.

**Auth Required:** Yes

**Response (200):**
```json
{
  "can_cancel_free": true,
  "fee_percent": 0,
  "fee_amount": 0,
  "hours_until_appointment": 48.5,
  "policy_description": "..."
}
```

---

### PUT `/cancellation/policy`
Update cancellation policy (stylist only).

**Auth Required:** Yes (stylist)

**Request Body:**
```json
{
  "free_cancellation_hours": 24,
  "late_cancellation_fee_percent": 50.0,
  "no_show_fee_percent": 100.0,
  "policy_description": "Custom policy description"
}
```

---

## 16. Credentials & Portfolio (Stylist)

### GET `/credentials/types`
Get all valid credential types and photo types (public, no auth).

**Response (200):**
```json
{
  "credential_types": [
    { "value": "beauty_therapy_certificate", "label": "Beauty Therapy Certificate" },
    { "value": "hairdressing_certificate", "label": "Hairdressing Certificate" },
    { "value": "makeup_artistry_certificate", "label": "Makeup Artistry Certificate" },
    { "value": "nail_technician_certificate", "label": "Nail Technician Certificate" },
    { "value": "skin_care_certificate", "label": "Skin Care Certificate" },
    { "value": "massage_therapy_certificate", "label": "Massage Therapy Certificate" },
    { "value": "cosmetic_tattoo_certificate", "label": "Cosmetic Tattoo Certificate" },
    { "value": "first_aid_certificate", "label": "First Aid Certificate" },
    { "value": "business_license", "label": "Business License / ABN" },
    { "value": "insurance_certificate", "label": "Professional Insurance Certificate" },
    { "value": "other", "label": "Other Professional Qualification" }
  ],
  "photo_types": [
    { "value": "full_length_glamour", "label": "Full Length Glamour Shot" },
    { "value": "head_and_shoulders", "label": "Professional Head & Shoulders" },
    { "value": "work_sample", "label": "Work Sample (Client Result)" },
    { "value": "before_after", "label": "Before & After" }
  ]
}
```

---

### GET `/credentials/my`
Get all credentials for the current stylist.

**Auth Required:** Yes (stylist)

---

### POST `/credentials/upload`
Upload a professional credential.

**Auth Required:** Yes (stylist)

**Request Body:**
```json
{
  "credential_type": "hairdressing_certificate",
  "credential_name": "Certificate III in Hairdressing",
  "issuing_organization": "TAFE Queensland",
  "issue_date": "2020-06-15T00:00:00Z",
  "expiry_date": null,
  "credential_number": "HAD-2020-12345",
  "document_url": "https://storage.example.com/docs/cert.pdf"
}
```

**Note:** Credentials start with `verification_status: "pending"` and must be verified by an admin.

---

### DELETE `/credentials/{credential_id}`
Delete a credential.

**Auth Required:** Yes (stylist)

---

### GET `/credentials/approval-status`
Check the stylist's overall approval status and credential summary.

**Auth Required:** Yes (stylist)

**Response (200):**
```json
{
  "approval_status": "pending",
  "approval_notes": null,
  "approved_at": null,
  "total_credentials": 3,
  "verified_credentials": 1,
  "pending_credentials": 2,
  "is_visible_to_clients": false
}
```

---

### Portfolio Photos

### GET `/credentials/portfolio`
Get the stylist's portfolio photos.

### POST `/credentials/portfolio`
Upload a portfolio photo.

**Request Body:**
```json
{
  "photo_url": "https://...",
  "photo_type": "work_sample",
  "caption": "Balayage highlights on dark hair"
}
```

Photos start with `moderation_status: "pending"` and must be approved by admin.

### DELETE `/credentials/portfolio/{photo_id}`
Delete a portfolio photo.

---

## 17. Payouts (Stylist)

### GET `/payouts/settings`
Get payout settings.

**Auth Required:** Yes (stylist)

**Response (200):**
```json
{
  "payout_frequency": "weekly",
  "bank_account_last4": "1234",
  "bank_name": "Commonwealth Bank",
  "bsb": "063-000",
  "is_verified": true,
  "total_earnings": 2450.00,
  "pending_balance": 350.00,
  "last_payout_at": "2026-02-01T00:00:00Z",
  "next_payout_at": "2026-02-10T00:00:00Z"
}
```

---

### PUT `/payouts/settings`
Update payout settings.

**Auth Required:** Yes (stylist)

**Request Body:**
```json
{
  "payout_frequency": "weekly",
  "bank_account_last4": "1234",
  "bank_name": "Commonwealth Bank",
  "bsb": "063-000"
}
```

**Valid Frequencies:** `"instant"`, `"daily"`, `"weekly"`, `"monthly"`

---

### GET `/payouts/earnings-summary`
Get comprehensive earnings breakdown.

**Auth Required:** Yes (stylist)

**Response (200):**
```json
{
  "total_bookings": 45,
  "total_revenue": 5400.00,
  "total_service_fees": 4800.00,
  "total_travel_fees": 600.00,
  "total_platform_fees": 720.00,
  "total_earnings": 4680.00,
  "pending_payout_amount": 350.00,
  "payout_frequency": "weekly",
  "next_payout_at": "2026-02-10T00:00:00Z",
  "is_payout_verified": true
}
```

---

### GET `/payouts/transactions`
Get payout transaction history.

**Auth Required:** Yes (stylist)

**Query Parameters:**
| Param | Type | Default |
|-------|------|---------|
| `limit` | int | 20 |
| `offset` | int | 0 |

---

## 18. Analytics (Stylist)

### GET `/analytics/dashboard`
Get stylist analytics dashboard data.

**Auth Required:** Yes (stylist)

---

### GET `/analytics/earnings-chart`
Get earnings chart data for visualization.

**Auth Required:** Yes (stylist)

---

## 19. Admin

Admin endpoints require the user's email to be in the configured `ADMIN_EMAILS` list.

### GET `/admin/dashboard/stats`
Platform-wide statistics.

### GET `/admin/stylists/pending`
List stylists pending approval.

### PUT `/admin/stylists/{stylist_id}/approval`
Approve or reject a stylist.

**Request Body:**
```json
{
  "status": "approved",
  "notes": "Welcome to the platform!"
}
```

### GET `/admin/credentials/pending`
List credentials pending verification.

### PUT `/admin/credentials/{credential_id}/verify`
Verify or reject a credential.

### GET `/admin/photos/pending`
List portfolio photos pending moderation.

### PUT `/admin/photos/{photo_id}/moderate`
Approve or reject a photo.

### POST `/admin/emails/send`
Send notifications to stylists (delivered as in-app notifications).

---

## 20. Data Models Reference

### User
| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string (UUID) | Unique identifier |
| `email` | string | Unique email address |
| `name` | string | Display name |
| `phone` | string | E.164 format phone number |
| `role` | string | `"client"` or `"stylist"` |
| `profile_image` | string | Profile photo URL |
| `stripe_customer_id` | string | Stripe customer ID (created on first payment) |
| `is_active` | boolean | Account active status |
| `created_at` | datetime | Registration timestamp |

### Stylist
| Field | Type | Description |
|-------|------|-------------|
| `stylist_id` | string (UUID) | Unique identifier |
| `user_id` | string (UUID) | Linked user account |
| `bio` | string | Profile biography |
| `skills` | string[] | Service skills list |
| `years_experience` | int | Years of experience |
| `service_latitude` | float | Service area center lat |
| `service_longitude` | float | Service area center lng |
| `service_address` | string | Service area display address |
| `service_radius_miles` | float | Service coverage radius |
| `portfolio_images` | string[] | Portfolio image URLs |
| `social_links` | object | Social media links |
| `is_verified` | boolean | Verification badge |
| `approval_status` | string | `"pending"`, `"approved"`, or `"rejected"` |
| `rating` | float | Average rating (1-5) |
| `review_count` | int | Total number of reviews |
| `total_bookings` | int | Total bookings completed |

### Booking
| Field | Type | Description |
|-------|------|-------------|
| `booking_id` | string (UUID) | Unique identifier |
| `client_id` | string (UUID) | Client's user_id |
| `stylist_id` | string (UUID) | Stylist's stylist_id |
| `services` | string[] | Booked services |
| `scheduled_datetime` | datetime | Appointment start time |
| `end_datetime` | datetime | Calculated end time |
| `status` | string | `pending`, `confirmed`, `in_progress`, `completed`, `cancelled` |
| `payment_status` | string | `pending`, `completed`, `refunded` |
| `service_price` | float | Total service cost (AUD) |
| `travel_cost` | float | Travel fee (AUD) |
| `total_price` | float | Grand total (AUD) |
| `platform_fee` | float | 15% platform commission (AUD) |
| `platform_fee_percent` | float | Commission percentage (15.0) |
| `stylist_earnings` | float | Stylist net earnings (AUD) |
| `travel_mode` | string | `stylist_travels`, `client_travels`, `own_arrangement` |
| `distance_miles` | float | Distance between client and stylist |
| `estimated_duration_minutes` | int | Total appointment duration |
| `notes` | string | Client notes |

### Rating
| Field | Type | Description |
|-------|------|-------------|
| `rating_id` | string (UUID) | Unique identifier |
| `booking_id` | string (UUID) | Associated booking |
| `user_id` | string (UUID) | Reviewer's user_id |
| `stylist_id` | string (UUID) | Rated stylist |
| `rating` | int | 1-5 star rating |
| `feedback` | string | Written review text |

### Notification
| Field | Type | Description |
|-------|------|-------------|
| `notification_id` | string (UUID) | Unique identifier |
| `user_id` | string (UUID) | Recipient |
| `title` | string | Notification title |
| `message` | string | Notification body |
| `data` | object | Extra metadata (e.g., `{ "booking_id": "...", "type": "..." }`) |
| `is_read` | boolean | Read status |

### Message
| Field | Type | Description |
|-------|------|-------------|
| `message_id` | string (UUID) | Unique identifier |
| `sender_id` | string (UUID) | Sender's user_id |
| `receiver_id` | string (UUID) | Receiver's user_id |
| `content` | string | Message text |
| `is_read` | boolean | Read status |

---

## 21. Error Handling

### Error Response Format
All errors follow this consistent format:

```json
{
  "detail": "Human-readable error message"
}
```

### HTTP Status Codes
| Code | Meaning | When |
|------|---------|------|
| `200` | Success | Request completed successfully |
| `201` | Created | Resource created (register, booking, etc.) |
| `400` | Bad Request | Invalid input, card declined, weak password |
| `401` | Unauthorized | Missing or invalid JWT token |
| `403` | Forbidden | Insufficient permissions (wrong role, not the owner) |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate (email exists, time slot taken, double booking) |
| `422` | Validation Error | Request body validation failed (Pydantic) |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Server Error | Internal error |

### Validation Error Format (422)
Pydantic validation errors return a detailed structure:
```json
{
  "detail": [
    {
      "loc": ["body", "password"],
      "msg": "Password must be at least 8 characters long",
      "type": "value_error"
    }
  ]
}
```

### Recommended Error Handling in React Native
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://your-domain.com/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken(); // from secure storage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — redirect to login
      clearToken();
      navigateToLogin();
    }
    return Promise.reject(error);
  }
);
```

---

## 22. Business Logic & Rules

### Platform Commission
- **15% fee** on the service price (not on travel costs)
- `platform_fee = service_price * 0.15`
- `stylist_earnings = service_price - platform_fee + travel_cost`

### Travel Fees
- **Formula:** `travel_cost = (distance_miles * $1.75) + $5.00 base fee` (when `travel_mode = "stylist_travels"`)
- No travel fee when `travel_mode` is `"client_travels"` or `"own_arrangement"`
- Distance calculated in **miles** using haversine formula from GPS coordinates
- Travel fees go directly to the stylist (not subject to platform commission)

### Booking Double-Booking Prevention
- Server checks for overlapping bookings before confirming
- Server checks stylist blocked times
- Server verifies the requested time falls within the stylist's working hours for that day

### Stylist Approval Workflow
1. Stylist registers → `approval_status: "pending"`
2. Stylist uploads credentials and portfolio photos
3. Admin reviews and approves/rejects via admin dashboard
4. Only `"approved"` stylists appear in search results
5. Notification sent to stylist on approval/rejection

### Credential Verification
1. Stylist uploads credential documents
2. Admin reviews and verifies/rejects
3. Verified credentials show as badges on stylist profiles
4. Types: beauty therapy, hairdressing, makeup artistry, nail tech, first aid, insurance, etc.

### Cancellation Rules
- Default: Free cancellation up to 24 hours before appointment
- Late cancellation: 50% fee (customizable per stylist)
- No-show: 100% fee (customizable per stylist)
- Use `GET /cancellation/calculate-fee/{booking_id}` to check before cancelling

### Loyalty Points
- **Earn:** 10 points per $1 AUD spent
- **Redeem:** 100 points = $1.00 AUD discount
- **Referral Bonus:** 250 points for new user, 500 for referrer (after first booking)
- **Tiers:** Bronze (0) → Silver (1,000) → Gold (5,000) → Platinum (15,000)

---

## 23. Mobile-Specific Notes

### Token Storage
Use secure storage for JWT tokens:
```javascript
// expo-secure-store (Expo)
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('auth_token', token);

// OR react-native-keychain (bare RN)
import * as Keychain from 'react-native-keychain';
await Keychain.setGenericPassword('auth', token);
```

### Push Notifications Setup
1. Set up Firebase Cloud Messaging in your React Native project
2. Get the FCM token on app launch
3. Send it to `POST /notifications/register-device`
4. Handle token refresh events
5. Process incoming notifications for deep linking

### Deep Linking Suggestions
Map notification `data.type` values to screens:
| Notification Type | Screen |
|------------------|--------|
| `booking_confirmed` | Booking Detail |
| `booking_cancelled` | Booking Detail |
| `booking_reminder` | Booking Detail |
| `new_message` | Chat / Conversation |
| `review_received` | Reviews |
| `profile_approved` | Stylist Dashboard |
| `credential_verified` | Credentials |

### Geolocation
- The backend expects coordinates in standard latitude/longitude format
- Use `react-native-geolocation-service` or Expo's `Location` module
- Default fallback: Gold Coast, Australia (-28.0167, 153.4000)
- Send user location with booking requests for accurate travel fee calculation

### Image Uploads
The API accepts **image URLs** (not file uploads). You'll need to:
1. Upload images to a cloud storage service (e.g., Firebase Storage, Cloudinary, AWS S3)
2. Get the public URL
3. Send the URL to the API

This applies to: portfolio photos, credential documents, review photos, and profile images.

### Stripe Integration for React Native
For the best mobile payment experience:
1. Use `@stripe/stripe-react-native` SDK
2. Get the publishable key from `GET /payments/config`
3. For new payments: Open Stripe Checkout URL in a WebView
4. For saved cards: Use `POST /payments/charge-saved-card` directly
5. Handle 3D Secure: If `status: "requires_action"`, use the returned `client_secret` with Stripe SDK

### Offline Considerations
- Cache the stylist list and booking history locally
- Queue messages for send-when-online
- Show cached data with "last updated" timestamps
- Notifications will be delivered by FCM even when app is backgrounded

### API Timeout Recommendations
| Endpoint Type | Timeout |
|---------------|---------|
| Auth / CRUD | 10s |
| Search | 15s |
| Payment | 30s |
| AI Chat | 30s |
| Image upload | 60s |

---

## Quick Reference: All Endpoints

| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| POST | `/auth/register` | No | - |
| POST | `/auth/login` | No | - |
| POST | `/auth/forgot-password` | No | - |
| POST | `/auth/reset-password` | No | - |
| GET | `/auth/me` | Yes | Any |
| POST | `/stylists/register` | No | - |
| GET | `/stylists/search` | No | - |
| GET | `/stylists/top` | No | - |
| GET | `/stylists/{id}` | No | - |
| GET | `/stylists/profile/me` | Yes | Stylist |
| POST | `/bookings/estimate` | Yes | Client |
| POST | `/bookings/create` | Yes | Client |
| GET | `/bookings/my-bookings` | Yes | Any |
| PUT | `/bookings/{id}/status` | Yes | Stylist |
| POST | `/bookings/{id}/cancel` | Yes | Any |
| POST | `/bookings/{id}/extend` | Yes | Any |
| GET | `/payments/config` | No | - |
| POST | `/payments/create-checkout` | Yes | Client |
| GET | `/payments/saved-cards` | Yes | Client |
| DELETE | `/payments/saved-cards/{id}` | Yes | Client |
| POST | `/payments/charge-saved-card` | Yes | Client |
| POST | `/payments/tip` | Yes | Client |
| GET | `/payments/status/{session_id}` | No | - |
| POST | `/availability/set` | Yes | Stylist |
| POST | `/availability/block-time` | Yes | Stylist |
| DELETE | `/availability/block-time/{id}` | Yes | Stylist |
| GET | `/availability/stylist/{id}` | No | - |
| GET | `/availability/my-calendar` | Yes | Stylist |
| POST | `/ratings/` | Yes | Client |
| GET | `/ratings/stylist/{id}` | No | - |
| POST | `/review-photos/upload` | Yes | Client |
| GET | `/review-photos/rating/{id}` | No | - |
| POST | `/favorites/add/{id}` | Yes | Any |
| DELETE | `/favorites/remove/{id}` | Yes | Any |
| GET | `/favorites/my-favorites` | Yes | Any |
| GET | `/favorites/check/{id}` | Yes | Any |
| POST | `/messages/send` | Yes | Any |
| GET | `/messages/conversations` | Yes | Any |
| GET | `/messages/conversation/{id}` | Yes | Any |
| POST | `/notifications/register-device` | Yes | Any |
| GET | `/notifications/` | Yes | Any |
| PUT | `/notifications/{id}/read` | Yes | Any |
| POST | `/chat/` | Optional | Any |
| GET | `/search/stylists` | No | - |
| GET | `/search/services` | No | - |
| GET | `/search/price-range` | No | - |
| GET | `/loyalty/` | Yes | Any |
| GET | `/loyalty/transactions` | Yes | Any |
| POST | `/loyalty/redeem` | Yes | Any |
| POST | `/loyalty/apply-referral/{code}` | Yes | Any |
| GET | `/cancellation/policy/{id}` | No | - |
| GET | `/cancellation/calculate-fee/{id}` | Yes | Any |
| PUT | `/cancellation/policy` | Yes | Stylist |
| GET | `/credentials/types` | No | - |
| GET | `/credentials/my` | Yes | Stylist |
| POST | `/credentials/upload` | Yes | Stylist |
| DELETE | `/credentials/{id}` | Yes | Stylist |
| GET | `/credentials/approval-status` | Yes | Stylist |
| GET | `/credentials/portfolio` | Yes | Stylist |
| POST | `/credentials/portfolio` | Yes | Stylist |
| DELETE | `/credentials/portfolio/{id}` | Yes | Stylist |
| GET | `/payouts/settings` | Yes | Stylist |
| PUT | `/payouts/settings` | Yes | Stylist |
| GET | `/payouts/earnings-summary` | Yes | Stylist |
| GET | `/payouts/transactions` | Yes | Stylist |
| GET | `/analytics/dashboard` | Yes | Stylist |
| GET | `/analytics/earnings-chart` | Yes | Stylist |

---

*This document was generated from the Onda backend codebase. For questions or discrepancies, refer to the backend route files in `backend/app/routes/`.*
