from fastapi import APIRouter, Query, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.db_models import Stylist, StylistPricing, User, Booking
from datetime import datetime, timezone, timedelta
from typing import List, Optional
import math

router = APIRouter(prefix="/search", tags=["search"])

class SearchFilters(BaseModel):
    services: Optional[List[str]] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_rating: Optional[float] = None
    max_distance: Optional[float] = None
    available_date: Optional[datetime] = None
    sort_by: Optional[str] = "rating"

class StylistSearchResult(BaseModel):
    stylist_id: str
    name: str
    profile_image: Optional[str]
    bio: Optional[str]
    average_rating: float
    total_ratings: int
    hearts: int
    years_experience: Optional[int]
    skills: List[str]
    distance_miles: Optional[float]
    starting_price: Optional[float]
    is_available: bool

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 3959
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

@router.get("/stylists", response_model=List[StylistSearchResult])
async def search_stylists(
    services: Optional[str] = Query(None, description="Comma-separated list of services"),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    max_distance: Optional[float] = Query(None, ge=0),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
    available_date: Optional[str] = Query(None, description="ISO date string"),
    sort_by: str = Query("rating", enum=["rating", "distance", "price_low", "price_high", "experience"]),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    query = select(Stylist).options(selectinload(Stylist.pricing), selectinload(Stylist.user)).where(Stylist.approval_status == "approved")
    
    service_list = services.split(",") if services else None
    
    if service_list:
        service_conditions = []
        for service in service_list:
            service_conditions.append(
                func.jsonb_exists(Stylist.skills, service.strip().lower())
            )
        if service_conditions:
            pass
    
    if min_rating is not None:
        query = query.where(Stylist.average_rating >= min_rating)
    
    result = await db.execute(query)
    stylists = result.scalars().all()
    
    search_results = []
    
    for stylist in stylists:
        if not stylist.user:
            continue
        
        distance = None
        if latitude is not None and longitude is not None and stylist.service_latitude and stylist.service_longitude:
            distance = haversine_distance(latitude, longitude, stylist.service_latitude, stylist.service_longitude)
            
            if max_distance is not None and distance > max_distance:
                continue
        
        starting_price = None
        if stylist.pricing:
            prices = [p.price_min for p in stylist.pricing]
            if prices:
                starting_price = min(prices)
                
                if min_price is not None and starting_price < min_price:
                    continue
                if max_price is not None and starting_price > max_price:
                    continue
        
        if service_list:
            stylist_skills = [s.lower() for s in (stylist.skills or [])]
            has_service = any(
                service.strip().lower() in stylist_skills 
                for service in service_list
            )
            if not has_service:
                continue
        
        is_available = True
        if available_date:
            try:
                check_date = datetime.fromisoformat(available_date.replace('Z', '+00:00'))
                
                bookings_result = await db.execute(
                    select(Booking).where(and_(
                        Booking.stylist_id == stylist.stylist_id,
                        Booking.status.in_(["pending", "accepted", "confirmed"]),
                        func.date(Booking.scheduled_datetime) == check_date.date()
                    ))
                )
                day_bookings = bookings_result.scalars().all()
                
                if len(day_bookings) >= 8:
                    is_available = False
            except:
                pass
        
        search_results.append(StylistSearchResult(
            stylist_id=stylist.stylist_id,
            name=stylist.user.name,
            profile_image=stylist.user.profile_image,
            bio=stylist.bio,
            average_rating=stylist.average_rating or 0,
            total_ratings=stylist.total_ratings or 0,
            hearts=int((stylist.total_ratings or 0) * (stylist.average_rating or 0)),
            years_experience=stylist.years_experience,
            skills=stylist.skills or [],
            distance_miles=round(distance, 1) if distance else None,
            starting_price=starting_price,
            is_available=is_available
        ))
    
    if sort_by == "rating":
        search_results.sort(key=lambda x: x.average_rating, reverse=True)
    elif sort_by == "distance" and latitude is not None:
        search_results.sort(key=lambda x: x.distance_miles if x.distance_miles else float('inf'))
    elif sort_by == "price_low":
        search_results.sort(key=lambda x: x.starting_price if x.starting_price else float('inf'))
    elif sort_by == "price_high":
        search_results.sort(key=lambda x: x.starting_price if x.starting_price else 0, reverse=True)
    elif sort_by == "experience":
        search_results.sort(key=lambda x: x.years_experience if x.years_experience else 0, reverse=True)
    
    return search_results[offset:offset + limit]

@router.get("/services")
async def get_available_services(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StylistPricing.service).distinct())
    services = result.scalars().all()
    
    service_categories = {
        "Hair": ["haircut", "coloring", "styling", "highlights", "balayage", "blowout", "extensions"],
        "Skin": ["facial", "chemical peel", "microdermabrasion", "acne treatment"],
        "Nails": ["manicure", "pedicure", "gel nails", "acrylic nails", "nail art"],
        "Hair Removal": ["waxing", "threading", "laser hair removal"],
        "Makeup": ["bridal makeup", "event makeup", "makeup lesson"],
        "Cosmetic Tattoo": ["microblading", "lip blush", "eyeliner tattoo"]
    }
    
    categorized = {}
    for category, category_services in service_categories.items():
        matching = [s for s in services if s.lower() in [cs.lower() for cs in category_services]]
        if matching:
            categorized[category] = matching
    
    return {
        "all_services": sorted(set(services)),
        "by_category": categorized
    }

@router.get("/price-range")
async def get_price_range(
    service: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(
        func.min(StylistPricing.price_min),
        func.max(StylistPricing.price_max)
    )
    
    if service:
        query = query.where(StylistPricing.service.ilike(f"%{service}%"))
    
    result = await db.execute(query)
    row = result.first()
    
    return {
        "min_price": row[0] or 0,
        "max_price": row[1] or 500,
        "service_filter": service
    }
