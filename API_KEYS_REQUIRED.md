# API Keys Required for BeautyBook Platform

This document lists all external API keys and credentials needed to complete the full functionality of the BeautyBook platform.

## Critical APIs (Required for Core Features)

### 1. Google Maps API
**Purpose**: Distance calculation, map display, location autocomplete
**Where to obtain**: https://console.cloud.google.com/google/maps-apis
**Required APIs to enable**:
- Maps JavaScript API
- Places API
- Distance Matrix API
- Geocoding API

**Cost**: Free tier includes $200/month credit (~28,000 map loads)
**Add to backend/.env**:
```
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 2. Firebase (Google Cloud)
**Purpose**: Push notifications, real-time database for messaging
**Where to obtain**: https://console.firebase.google.com
**Setup Steps**:
1. Create new Firebase project
2. Enable Cloud Messaging
3. Enable Realtime Database
4. Download service account JSON

**Add to backend/.env**:
```
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_WEB_API_KEY=your_web_api_key
```

**Add to frontend/.env**:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_VAPID_KEY=your_vapid_key
```

### 3. Cloudflare Turnstile (Already Configured)
**Purpose**: Bot protection
**Status**: ✅ Using test keys (1x00000000000000000000AA)
**For Production**: Get keys at https://dash.cloudflare.com/

## APIs Already Configured

### Stripe Payment
**Status**: ✅ Configured with test key (sk_test_emergent)
**Purpose**: Payments and tipping
**Note**: Test mode works for all payment features

### Uber API
**Status**: ⚠️ Using fallback Haversine calculation
**Purpose**: Distance/pricing calculation
**Note**: Currently functional with mathematical fallback. Optional to add real Uber API keys.

### Emergent Google OAuth
**Status**: ✅ Ready to integrate (no keys needed)
**Purpose**: Google social login
**Integration**: Uses Emergent's managed OAuth flow

## Optional APIs (Nice to Have)

### Twilio SMS
**Purpose**: SMS notifications as backup to push notifications
**Where to obtain**: https://www.twilio.com/console
**Cost**: $0.0075 per SMS (US)
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### SendGrid Email
**Purpose**: Email notifications and receipts
**Where to obtain**: https://app.sendgrid.com/settings/api_keys
**Cost**: Free tier includes 100 emails/day
```
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@beautybook.com
```

### AWS S3 or Cloudflare R2
**Purpose**: Portfolio image storage (up to 1000 photos per stylist)
**Where to obtain**: 
- AWS S3: https://aws.amazon.com/s3/
- Cloudflare R2: https://www.cloudflare.com/products/r2/

**Cost**: 
- S3: $0.023/GB storage + transfer costs
- R2: $0.015/GB storage, free egress

```
# For AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=beautybook-portfolios
AWS_REGION=us-east-1

# OR for Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=beautybook-portfolios
```

## Implementation Priority

### Phase 1: Must Have Before Launch
1. ✅ Stripe (already configured)
2. 🔴 Google Maps API (critical for distance/maps)
3. 🔴 Firebase (critical for messaging and notifications)

### Phase 2: Highly Recommended
4. 🟡 Emergent Google OAuth (improves signup conversion)
5. 🟡 Image storage (S3/R2) for portfolio photos

### Phase 3: Optional Enhancements
6. ⚪ Twilio SMS (backup notifications)
7. ⚪ SendGrid (email receipts)
8. ⚪ Real Uber API keys (already have fallback)

## Cost Estimate (Monthly)

**Minimal Setup** (Firebase + Google Maps only):
- Free tier: $0/month for first few months
- Light usage: $10-30/month

**Full Setup** (All services):
- Estimated: $50-150/month depending on usage
- Scales with platform growth

## Setup Instructions

1. **Immediate**: Obtain Google Maps and Firebase keys
2. **Add keys** to `.env` files (backend and frontend)
3. **Restart services**: `sudo supervisorctl restart backend frontend`
4. **Test integrations**: Use testing endpoints to verify

## Security Notes

- Never commit `.env` files to version control
- Use environment variables in production (not .env files)
- Rotate keys periodically
- Use separate keys for development/staging/production
- Enable API key restrictions (domain/IP whitelisting)

## Support

If you need help obtaining any API keys:
1. Follow the links provided above
2. Each service has detailed setup documentation
3. Most offer free tiers perfect for testing
4. Contact support if you encounter issues

---

**Status**: Ready to implement all features once keys are provided.
**Next Step**: Obtain Google Maps and Firebase credentials to enable full functionality.
