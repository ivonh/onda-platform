import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.database import AsyncSessionLocal, init_db
from app.models.db_models import User, Stylist, StylistPricing, generate_uuid
from sqlalchemy import select
from passlib.context import CryptContext
from datetime import datetime, timezone

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MOCK_STYLISTS = [
    {
        "name": "Sophie Chen",
        "email": "sophie@onda.com",
        "bio": "Award-winning hair stylist with 12 years experience. Specializing in balayage and modern cuts.",
        "skills": ["haircut", "coloring", "styling"],
        "years_experience": 12,
        "latitude": -27.9380,
        "longitude": 153.3960,
        "address": "Labrador, Gold Coast QLD",
        "radius": 30,
        "portfolio": ["https://images.unsplash.com/photo-1562322140-8baeececf3df?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"],
        "profile_image": "https://images.unsplash.com/photo-1562322140-8baeececf3df?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "rating": 4.9,
        "total_ratings": 234,
        "pricing": [
            {"service": "haircut", "price_min": 65, "price_max": 120, "duration": 45},
            {"service": "coloring", "price_min": 150, "price_max": 350, "duration": 120},
            {"service": "styling", "price_min": 80, "price_max": 150, "duration": 60},
        ],
    },
    {
        "name": "Marcus Webb",
        "email": "marcus@onda.com",
        "bio": "Men's grooming specialist. Expert in fades, classic cuts and beard styling.",
        "skills": ["haircut", "styling", "coloring"],
        "years_experience": 8,
        "latitude": -27.9650,
        "longitude": 153.4280,
        "address": "Southport, Gold Coast QLD",
        "radius": 25,
        "portfolio": ["https://images.unsplash.com/photo-1621605815971-fbc98d665033?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"],
        "profile_image": "https://images.unsplash.com/photo-1621605815971-fbc98d665033?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "rating": 4.8,
        "total_ratings": 178,
        "pricing": [
            {"service": "haircut", "price_min": 45, "price_max": 85, "duration": 30},
            {"service": "styling", "price_min": 35, "price_max": 60, "duration": 20},
            {"service": "coloring", "price_min": 80, "price_max": 150, "duration": 60},
        ],
    },
    {
        "name": "Isabella Romano",
        "email": "isabella@onda.com",
        "bio": "Luxury skincare expert trained in Paris. Specializing in anti-aging treatments.",
        "skills": ["facial", "threading", "waxing"],
        "years_experience": 15,
        "latitude": -28.0027,
        "longitude": 153.4300,
        "address": "Surfers Paradise, Gold Coast QLD",
        "radius": 35,
        "portfolio": ["https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"],
        "profile_image": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "rating": 4.95,
        "total_ratings": 312,
        "pricing": [
            {"service": "facial", "price_min": 120, "price_max": 280, "duration": 75},
            {"service": "threading", "price_min": 25, "price_max": 55, "duration": 20},
            {"service": "waxing", "price_min": 45, "price_max": 120, "duration": 45},
        ],
    },
    {
        "name": "Jade Nguyen",
        "email": "jade@onda.com",
        "bio": "Nail artist extraordinaire. Known for intricate nail art and gel extensions.",
        "skills": ["nails", "waxing"],
        "years_experience": 6,
        "latitude": -28.0792,
        "longitude": 153.4380,
        "address": "Broadbeach, Gold Coast QLD",
        "radius": 25,
        "portfolio": ["https://images.unsplash.com/photo-1604654894610-df63bc536371?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"],
        "profile_image": "https://images.unsplash.com/photo-1604654894610-df63bc536371?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "rating": 4.85,
        "total_ratings": 198,
        "pricing": [
            {"service": "nails", "price_min": 55, "price_max": 150, "duration": 60},
            {"service": "waxing", "price_min": 40, "price_max": 100, "duration": 40},
        ],
    },
    {
        "name": "Emma Thompson",
        "email": "emma@onda.com",
        "bio": "Cosmetic tattoo specialist. Expert in microblading, lip blush and eyeliner.",
        "skills": ["cosmetic_tattoo", "threading"],
        "years_experience": 10,
        "latitude": -27.8950,
        "longitude": 153.3850,
        "address": "Runaway Bay, Gold Coast QLD",
        "radius": 40,
        "portfolio": ["https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"],
        "profile_image": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "rating": 4.92,
        "total_ratings": 156,
        "pricing": [
            {"service": "cosmetic_tattoo", "price_min": 350, "price_max": 800, "duration": 120},
            {"service": "threading", "price_min": 20, "price_max": 45, "duration": 15},
        ],
    },
    {
        "name": "Olivia Martinez",
        "email": "olivia@onda.com",
        "bio": "Color correction specialist. Transforming hair with vibrant, long-lasting color.",
        "skills": ["haircut", "coloring", "styling"],
        "years_experience": 9,
        "latitude": -27.8456,
        "longitude": 153.3420,
        "address": "Paradise Point, Gold Coast QLD",
        "radius": 30,
        "portfolio": ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"],
        "profile_image": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "rating": 4.78,
        "total_ratings": 145,
        "pricing": [
            {"service": "haircut", "price_min": 70, "price_max": 130, "duration": 50},
            {"service": "coloring", "price_min": 180, "price_max": 400, "duration": 150},
            {"service": "styling", "price_min": 90, "price_max": 180, "duration": 70},
        ],
    },
    {
        "name": "Mia Anderson",
        "email": "mia@onda.com",
        "bio": "Holistic beauty therapist. Combining traditional techniques with modern skincare.",
        "skills": ["facial", "waxing", "threading"],
        "years_experience": 7,
        "latitude": -27.9168,
        "longitude": 153.3890,
        "address": "Biggera Waters, Gold Coast QLD",
        "radius": 25,
        "portfolio": ["https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"],
        "profile_image": "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "rating": 4.82,
        "total_ratings": 167,
        "pricing": [
            {"service": "facial", "price_min": 95, "price_max": 220, "duration": 60},
            {"service": "waxing", "price_min": 35, "price_max": 90, "duration": 35},
            {"service": "threading", "price_min": 18, "price_max": 40, "duration": 15},
        ],
    },
    {
        "name": "Zara Williams",
        "email": "zara@onda.com",
        "bio": "Creative nail technician and PMU artist. Instagram-worthy designs every time.",
        "skills": ["nails", "cosmetic_tattoo"],
        "years_experience": 5,
        "latitude": -27.4705,
        "longitude": 153.0260,
        "address": "South Brisbane QLD",
        "radius": 35,
        "portfolio": ["https://images.unsplash.com/photo-1596755389378-c31d21fd1273?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"],
        "profile_image": "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "rating": 4.88,
        "total_ratings": 203,
        "pricing": [
            {"service": "nails", "price_min": 65, "price_max": 180, "duration": 75},
            {"service": "cosmetic_tattoo", "price_min": 400, "price_max": 900, "duration": 150},
        ],
    },
    {
        "name": "Lily Park",
        "email": "lily@onda.com",
        "bio": "K-beauty hair specialist. Expert in Asian hair textures and Korean styling trends.",
        "skills": ["haircut", "styling", "coloring"],
        "years_experience": 6,
        "latitude": -27.5598,
        "longitude": 153.0850,
        "address": "Woolloongabba, Brisbane QLD",
        "radius": 40,
        "portfolio": ["https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"],
        "profile_image": "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "rating": 4.75,
        "total_ratings": 134,
        "pricing": [
            {"service": "haircut", "price_min": 60, "price_max": 110, "duration": 45},
            {"service": "styling", "price_min": 70, "price_max": 140, "duration": 55},
            {"service": "coloring", "price_min": 140, "price_max": 320, "duration": 100},
        ],
    },
    {
        "name": "Ruby Chen",
        "email": "ruby@onda.com",
        "bio": "Medical aesthetician. Specializing in acne treatment and skin rejuvenation.",
        "skills": ["facial", "threading", "waxing"],
        "years_experience": 11,
        "latitude": -27.6160,
        "longitude": 153.1050,
        "address": "Coorparoo, Brisbane QLD",
        "radius": 30,
        "portfolio": ["https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"],
        "profile_image": "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "rating": 4.91,
        "total_ratings": 189,
        "pricing": [
            {"service": "facial", "price_min": 110, "price_max": 260, "duration": 70},
            {"service": "threading", "price_min": 22, "price_max": 48, "duration": 18},
            {"service": "waxing", "price_min": 42, "price_max": 110, "duration": 42},
        ],
    },
    {
        "name": "Hannah Wilson",
        "email": "hannah@onda.com",
        "bio": "Award-winning nail tech. Specializing in natural nail care and gel art.",
        "skills": ["nails", "waxing"],
        "years_experience": 4,
        "latitude": -27.9998,
        "longitude": 153.3650,
        "address": "Bundall, Gold Coast QLD",
        "radius": 25,
        "portfolio": ["https://images.unsplash.com/photo-1632345031435-8727f6897d53?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"],
        "profile_image": "https://images.unsplash.com/photo-1632345031435-8727f6897d53?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "rating": 4.79,
        "total_ratings": 156,
        "pricing": [
            {"service": "nails", "price_min": 50, "price_max": 130, "duration": 55},
            {"service": "waxing", "price_min": 38, "price_max": 95, "duration": 38},
        ],
    },
    {
        "name": "Grace Taylor",
        "email": "grace@onda.com",
        "bio": "Multi-talented beauty artist. From stunning hair transformations to perfect brows.",
        "skills": ["haircut", "coloring", "styling", "cosmetic_tattoo"],
        "years_experience": 13,
        "latitude": -27.7820,
        "longitude": 153.2680,
        "address": "Nerang, Gold Coast QLD",
        "radius": 45,
        "portfolio": ["https://images.unsplash.com/photo-1560066984-138dadb4c035?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"],
        "profile_image": "https://images.unsplash.com/photo-1560066984-138dadb4c035?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "rating": 4.86,
        "total_ratings": 278,
        "pricing": [
            {"service": "haircut", "price_min": 55, "price_max": 100, "duration": 40},
            {"service": "coloring", "price_min": 130, "price_max": 300, "duration": 90},
            {"service": "styling", "price_min": 65, "price_max": 120, "duration": 50},
            {"service": "cosmetic_tattoo", "price_min": 300, "price_max": 700, "duration": 100},
        ],
    },
]

async def seed():
    await init_db()
    async with AsyncSessionLocal() as session:
        created = 0
        skipped = 0
        for s in MOCK_STYLISTS:
            result = await session.execute(select(User).where(User.email == s["email"]))
            if result.scalar_one_or_none():
                skipped += 1
                continue

            user_id = generate_uuid()
            stylist_id = generate_uuid()
            parts = s["name"].split(" ", 1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else ""

            user = User(
                user_id=user_id,
                email=s["email"],
                hashed_password=pwd_context.hash("OndaDemo2026!"),
                name=s["name"],
                first_name=first_name,
                last_name=last_name,
                role="stylist",
                profile_image=s.get("profile_image"),
                is_active=True,
            )
            session.add(user)

            stylist = Stylist(
                stylist_id=stylist_id,
                user_id=user_id,
                bio=s["bio"],
                years_experience=s["years_experience"],
                skills=s["skills"],
                service_latitude=s["latitude"],
                service_longitude=s["longitude"],
                service_address=s["address"],
                service_radius_miles=s["radius"],
                portfolio_images=s["portfolio"],
                approval_status="approved",
                approved_at=datetime.now(timezone.utc),
                average_rating=s["rating"],
                total_ratings=s["total_ratings"],
                is_verified=True,
            )
            session.add(stylist)

            for p in s["pricing"]:
                pricing = StylistPricing(
                    stylist_id=stylist_id,
                    service=p["service"],
                    price_min=p["price_min"],
                    price_max=p["price_max"],
                    duration_minutes=p["duration"],
                )
                session.add(pricing)

            created += 1

        await session.commit()
        print(f"Seeding complete: {created} stylists created, {skipped} skipped (already exist)")

if __name__ == "__main__":
    asyncio.run(seed())
