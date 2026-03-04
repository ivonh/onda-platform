# Backend API Keys Required

## Critical APIs (Required for Core Features)

### MongoDB
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name (default: beauty_booking_db)

### Authentication
- `JWT_SECRET_KEY` - Secret key for JWT token signing
- `JWT_ALGORITHM` - Algorithm (default: HS256)
- `JWT_EXPIRE_MINUTES` - Token expiration (default: 10080)

### Google Maps API
- `GOOGLE_MAPS_API_KEY` - For distance calculation, map display, location autocomplete
- Required APIs: Maps JavaScript API, Places API, Distance Matrix API, Geocoding API
- Obtain at: https://console.cloud.google.com/google/maps-apis

### Firebase
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_PRIVATE_KEY` - Service account private key
- `FIREBASE_CLIENT_EMAIL` - Service account email
- `FIREBASE_DATABASE_URL` - Realtime database URL
- `FIREBASE_WEB_API_KEY` - Web API key
- Obtain at: https://console.firebase.google.com

### Stripe Payments
- `STRIPE_API_KEY` - Stripe secret key for payments and tipping
- Obtain at: https://dashboard.stripe.com/apikeys

### Cloudflare Turnstile
- `CLOUDFLARE_TURNSTILE_SECRET_KEY` - Bot protection secret key
- Obtain at: https://dash.cloudflare.com/

## Optional APIs

### Uber API
- `UBER_CLIENT_ID` - Uber OAuth client ID
- `UBER_CLIENT_SECRET` - Uber OAuth client secret
- `UBER_SANDBOX_MODE` - Enable sandbox mode (default: true)
- Note: Has fallback Haversine calculation if not configured

### Twilio SMS
- `TWILIO_ACCOUNT_SID` - Account SID
- `TWILIO_AUTH_TOKEN` - Auth token
- `TWILIO_PHONE_NUMBER` - Sender phone number
- Obtain at: https://www.twilio.com/console

### SendGrid Email
- `SENDGRID_API_KEY` - API key
- `SENDGRID_FROM_EMAIL` - Sender email address
- Obtain at: https://app.sendgrid.com/settings/api_keys

### AWS S3 (Image Storage)
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_S3_BUCKET_NAME` - S3 bucket name
- `AWS_REGION` - AWS region

### Cloudflare R2 (Alternative Image Storage)
- `R2_ACCOUNT_ID` - Cloudflare account ID
- `R2_ACCESS_KEY_ID` - R2 access key
- `R2_SECRET_ACCESS_KEY` - R2 secret key
- `R2_BUCKET_NAME` - R2 bucket name

## CORS Configuration
- `CORS_ORIGINS` - Comma-separated list of allowed origins (default: *)
