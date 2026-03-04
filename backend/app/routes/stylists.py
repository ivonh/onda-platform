from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.db_models import User, Stylist, StylistPricing, StylistCredential
from app.routes.auth import get_current_user_full
from app.utils.security import hash_password, create_access_token
from typing import List, Optional
from datetime import datetime
import math

router = APIRouter(prefix="/stylists", tags=["stylists"])

class LocationModel(BaseModel):
    latitude: float
    longitude: float
    address: str

class PricingItem(BaseModel):
    service: str
    price_min: float
    price_max: float
    duration_minutes: int

class StylistProfileCreate(BaseModel):
    skills: List[str]
    bio: Optional[str] = None
    years_experience: Optional[int] = None
    service_area: LocationModel
    service_radius_miles: float = 10.0
    portfolio_images: List[str] = []

class StylistRegister(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    phone: str
    profile: StylistProfileCreate
    pricing: List[PricingItem]

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 3959
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_stylist(data: StylistRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")
    
    first_name = data.first_name or ''
    last_name = data.last_name or ''
    if not first_name and data.name:
        parts = data.name.strip().split(' ', 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ''
    
    full_name = f"{first_name} {last_name}".strip() or data.name or ''
    
    dob = None
    if data.date_of_birth:
        from datetime import date as date_type, timezone as tz
        try:
            dob_date = date_type.fromisoformat(data.date_of_birth)
            today = date_type.today()
            age = today.year - dob_date.year - ((today.month, today.day) < (dob_date.month, dob_date.day))
            if age < 18:
                raise HTTPException(status_code=422, detail="You must be at least 18 years old to register")
            from datetime import datetime as dt
            dob = dt(dob_date.year, dob_date.month, dob_date.day, tzinfo=tz.utc)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid date of birth format")
    
    new_user = User(
        email=data.email,
        name=full_name,
        first_name=first_name,
        last_name=last_name,
        date_of_birth=dob,
        hashed_password=hash_password(data.password),
        phone=data.phone,
        role="stylist"
    )
    db.add(new_user)
    await db.flush()
    
    new_stylist = Stylist(
        user_id=new_user.user_id,
        bio=data.profile.bio,
        years_experience=data.profile.years_experience,
        skills=data.profile.skills,
        service_latitude=data.profile.service_area.latitude,
        service_longitude=data.profile.service_area.longitude,
        service_address=data.profile.service_area.address,
        service_radius_miles=data.profile.service_radius_miles,
        portfolio_images=data.profile.portfolio_images
    )
    db.add(new_stylist)
    await db.flush()
    
    for p in data.pricing:
        pricing = StylistPricing(
            stylist_id=new_stylist.stylist_id,
            service=p.service,
            price_min=p.price_min,
            price_max=p.price_max,
            duration_minutes=p.duration_minutes
        )
        db.add(pricing)
    
    await db.commit()
    
    access_token = create_access_token({"sub": new_user.user_id, "role": "stylist"})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "user_id": new_user.user_id,
            "email": data.email,
            "name": full_name,
            "first_name": first_name,
            "last_name": last_name,
            "role": "stylist"
        },
        "stylist_id": new_stylist.stylist_id
    }

@router.get("/search")
async def search_stylists(
    service: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    max_distance: float = 25.0,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Stylist)
        .options(selectinload(Stylist.user), selectinload(Stylist.pricing), selectinload(Stylist.credentials))
        .join(Stylist.user)
        .where(User.is_active == True)
        .where(Stylist.approval_status == "approved")
        .limit(limit)
    )
    stylists = result.scalars().all()
    
    response = []
    for stylist in stylists:
        if service and service not in (stylist.skills or []):
            continue
        
        distance = None
        if lat and lng and stylist.service_latitude and stylist.service_longitude:
            distance = haversine_distance(lat, lng, stylist.service_latitude, stylist.service_longitude)
            if distance > max_distance:
                continue
        
        verified_credentials = [
            {
                "credential_type": c.credential_type,
                "credential_name": c.credential_name
            }
            for c in (stylist.credentials or [])
            if c.verification_status == "verified"
        ]
        
        response.append({
            "stylist_id": stylist.stylist_id,
            "name": stylist.user.name if stylist.user else "Unknown",
            "bio": stylist.bio,
            "skills": stylist.skills or [],
            "years_experience": stylist.years_experience,
            "average_rating": stylist.average_rating,
            "total_ratings": stylist.total_ratings,
            "hearts": stylist.total_ratings * stylist.average_rating if stylist.average_rating else 0,
            "distance_miles": round(distance, 2) if distance else None,
            "profile": {
                "skills": stylist.skills or [],
                "service_area": {
                    "latitude": stylist.service_latitude,
                    "longitude": stylist.service_longitude,
                    "address": stylist.service_address
                }
            },
            "pricing": [
                {
                    "service": p.service,
                    "price_min": p.price_min,
                    "price_max": p.price_max,
                    "duration_minutes": p.duration_minutes
                }
                for p in stylist.pricing
            ],
            "portfolio_images": stylist.portfolio_images or [],
            "verified_credentials": verified_credentials
        })
    
    if lat and lng:
        response.sort(key=lambda x: x.get("distance_miles") or 9999)
    
    return response

@router.get("/top")
async def get_top_stylists(limit: int = 10, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Stylist)
        .options(selectinload(Stylist.user), selectinload(Stylist.pricing), selectinload(Stylist.credentials))
        .join(Stylist.user)
        .where(User.is_active == True)
        .where(Stylist.approval_status == "approved")
        .order_by(Stylist.average_rating.desc())
        .limit(limit)
    )
    stylists = result.scalars().all()
    
    response = []
    for s in stylists:
        verified_credentials = [
            {
                "credential_type": c.credential_type,
                "credential_name": c.credential_name
            }
            for c in (s.credentials or [])
            if c.verification_status == "verified"
        ]
        response.append({
            "stylist_id": s.stylist_id,
            "name": s.user.name if s.user else "Unknown",
            "bio": s.bio,
            "skills": s.skills or [],
            "years_experience": s.years_experience,
            "average_rating": s.average_rating,
            "total_ratings": s.total_ratings,
            "hearts": s.total_ratings * s.average_rating if s.average_rating else 0,
            "profile": {
                "skills": s.skills or [],
                "service_area": {
                    "latitude": s.service_latitude,
                    "longitude": s.service_longitude,
                    "address": s.service_address
                }
            },
            "pricing": [
                {
                    "service": p.service,
                    "price_min": p.price_min,
                    "price_max": p.price_max,
                    "duration_minutes": p.duration_minutes
                }
                for p in s.pricing
            ],
            "portfolio_images": s.portfolio_images or [],
            "verified_credentials": verified_credentials
        })
    
    return response

@router.get("/profile/me")
async def get_my_stylist_profile(user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.execute(
        select(Stylist)
        .options(selectinload(Stylist.pricing))
        .where(Stylist.user_id == user.user_id)
    )
    stylist = result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    return {
        "stylist_id": stylist.stylist_id,
        "user_id": stylist.user_id,
        "bio": stylist.bio,
        "skills": stylist.skills or [],
        "years_experience": stylist.years_experience,
        "average_rating": stylist.average_rating,
        "total_ratings": stylist.total_ratings,
        "total_bookings": stylist.total_bookings,
        "social_links": stylist.social_links or {},
        "profile": {
            "skills": stylist.skills or [],
            "service_area": {
                "latitude": stylist.service_latitude,
                "longitude": stylist.service_longitude,
                "address": stylist.service_address
            },
            "service_radius_miles": stylist.service_radius_miles
        },
        "pricing": [
            {
                "service": p.service,
                "price_min": p.price_min,
                "price_max": p.price_max,
                "duration_minutes": p.duration_minutes
            }
            for p in stylist.pricing
        ],
        "portfolio_images": stylist.portfolio_images or [],
        "availability_slots": stylist.availability_slots or []
    }

@router.get("/{stylist_id}")
async def get_stylist(stylist_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Stylist)
        .options(selectinload(Stylist.user), selectinload(Stylist.pricing), selectinload(Stylist.credentials))
        .where(Stylist.stylist_id == stylist_id)
    )
    stylist = result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist not found")
    
    verified_credentials = [
        {
            "credential_type": c.credential_type,
            "credential_name": c.credential_name,
            "issuing_organization": c.issuing_organization,
            "verified_at": c.verified_at.isoformat() if c.verified_at else None
        }
        for c in (stylist.credentials or [])
        if c.verification_status == "verified"
    ]
    
    return {
        "stylist_id": stylist.stylist_id,
        "name": stylist.user.name if stylist.user else "Unknown",
        "email": stylist.user.email if stylist.user else None,
        "bio": stylist.bio,
        "skills": stylist.skills or [],
        "years_experience": stylist.years_experience,
        "average_rating": stylist.average_rating,
        "total_ratings": stylist.total_ratings,
        "total_bookings": stylist.total_bookings,
        "is_verified": stylist.is_verified,
        "social_links": stylist.social_links or {},
        "profile": {
            "skills": stylist.skills or [],
            "service_area": {
                "latitude": stylist.service_latitude,
                "longitude": stylist.service_longitude,
                "address": stylist.service_address
            },
            "service_radius_miles": stylist.service_radius_miles
        },
        "pricing": [
            {
                "service": p.service,
                "price_min": p.price_min,
                "price_max": p.price_max,
                "duration_minutes": p.duration_minutes
            }
            for p in stylist.pricing
        ],
        "portfolio_images": stylist.portfolio_images or [],
        "availability_slots": stylist.availability_slots or [],
        "verified_credentials": verified_credentials
    }
