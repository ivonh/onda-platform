from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.db_models import User, Stylist, StylistPricing, Booking, BlockedTime, BookingReminder
from app.routes.auth import get_current_user_full
from datetime import datetime, timezone, timedelta
from typing import List, Optional
import math

router = APIRouter(prefix="/bookings", tags=["bookings"])

class LocationModel(BaseModel):
    latitude: float
    longitude: float
    address: str

class BookingRequest(BaseModel):
    stylist_id: str
    services: List[str]
    preferred_datetime: datetime
    client_location: Optional[LocationModel] = None
    notes: Optional[str] = None
    travel_mode: Optional[str] = "stylist_travels"
    meeting_location: Optional[LocationModel] = None

class PriceEstimateRequest(BaseModel):
    stylist_id: str
    services: List[str]
    client_location: Optional[LocationModel] = None
    travel_mode: Optional[str] = "stylist_travels"

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 3959
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

@router.post("/estimate")
async def estimate_booking(request: PriceEstimateRequest, user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Stylist)
        .options(selectinload(Stylist.pricing))
        .where(Stylist.stylist_id == request.stylist_id)
    )
    stylist = result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist not found")
    
    travel_mode = request.travel_mode or "stylist_travels"
    
    if travel_mode == "stylist_travels" and not request.client_location:
        raise HTTPException(status_code=400, detail="Client location is required when stylist travels to you")
    
    distance_miles = 0.0
    if travel_mode == "stylist_travels" and request.client_location:
        if stylist.service_latitude and stylist.service_longitude:
            distance_miles = calculate_distance(
                stylist.service_latitude,
                stylist.service_longitude,
                request.client_location.latitude,
                request.client_location.longitude
            )
    
    service_price = 0.0
    service_duration = 0
    for service in request.services:
        for pricing in stylist.pricing:
            if pricing.service == service:
                service_price += (pricing.price_min + pricing.price_max) / 2
                service_duration += pricing.duration_minutes
    
    if travel_mode == "stylist_travels":
        travel_cost = distance_miles * 1.75 + 5.0
    else:
        travel_cost = 0.0
    
    total_price = service_price + travel_cost
    
    platform_fee_percent = 15.0
    platform_fee = round(service_price * (platform_fee_percent / 100), 2)
    stylist_earnings = round(service_price - platform_fee + travel_cost, 2)
    
    return {
        "stylist_id": request.stylist_id,
        "distance_miles": round(distance_miles, 2),
        "service_price": round(service_price, 2),
        "travel_cost": round(travel_cost, 2),
        "platform_fee": platform_fee,
        "platform_fee_percent": platform_fee_percent,
        "stylist_earnings": stylist_earnings,
        "total_price": round(total_price, 2),
        "estimated_duration_minutes": service_duration,
        "services": request.services,
        "travel_mode": travel_mode
    }

@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_booking(request: BookingRequest, user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Stylist)
        .options(selectinload(Stylist.pricing))
        .where(Stylist.stylist_id == request.stylist_id)
    )
    stylist = result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist not found")
    
    travel_mode = request.travel_mode or "stylist_travels"
    
    if travel_mode == "stylist_travels" and not request.client_location:
        raise HTTPException(status_code=400, detail="Client location is required when stylist travels to you")
    
    if travel_mode == "own_arrangement":
        if not request.meeting_location or not request.meeting_location.address:
            raise HTTPException(status_code=400, detail="Meeting address is required when arranging your own travel")
    
    now = datetime.now(timezone.utc)
    preferred = request.preferred_datetime
    if preferred.tzinfo is None:
        preferred = preferred.replace(tzinfo=timezone.utc)
    if preferred <= now:
        raise HTTPException(status_code=400, detail="Cannot book an appointment in the past. Please select a future date and time.")
    
    distance_miles = 0.0
    if travel_mode == "stylist_travels" and request.client_location:
        if stylist.service_latitude and stylist.service_longitude:
            distance_miles = calculate_distance(
                stylist.service_latitude,
                stylist.service_longitude,
                request.client_location.latitude,
                request.client_location.longitude
            )
    
    service_price = 0.0
    service_duration = 0
    for service in request.services:
        for pricing in stylist.pricing:
            if pricing.service == service:
                service_price += (pricing.price_min + pricing.price_max) / 2
                service_duration += pricing.duration_minutes
    
    if service_duration == 0:
        service_duration = 60
    
    if travel_mode == "stylist_travels":
        travel_cost = distance_miles * 1.75 + 5.0
    else:
        travel_cost = 0.0
    
    total_price = service_price + travel_cost
    
    start_time = request.preferred_datetime
    end_time = start_time + timedelta(minutes=service_duration)
    
    conflicting = await db.execute(
        select(Booking).where(
            and_(
                Booking.stylist_id == request.stylist_id,
                Booking.status.in_(["pending", "accepted", "confirmed", "in_progress"]),
                or_(
                    and_(Booking.scheduled_datetime <= start_time, Booking.end_datetime > start_time),
                    and_(Booking.scheduled_datetime < end_time, Booking.end_datetime >= end_time),
                    and_(Booking.scheduled_datetime >= start_time, Booking.end_datetime <= end_time)
                )
            )
        )
    )
    if conflicting.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="This time slot is already booked. Please choose a different time.")
    
    blocked = await db.execute(
        select(BlockedTime).where(
            and_(
                BlockedTime.stylist_id == request.stylist_id,
                or_(
                    and_(BlockedTime.start_datetime <= start_time, BlockedTime.end_datetime > start_time),
                    and_(BlockedTime.start_datetime < end_time, BlockedTime.end_datetime >= end_time)
                )
            )
        )
    )
    if blocked.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Stylist is unavailable at this time.")
    
    meeting_loc = request.meeting_location
    client_loc = request.client_location
    
    platform_fee_percent = 15.0
    platform_fee = round(service_price * (platform_fee_percent / 100), 2)
    stylist_earnings = round(service_price - platform_fee + travel_cost, 2)
    
    new_booking = Booking(
        client_id=user.user_id,
        stylist_id=request.stylist_id,
        services=request.services,
        scheduled_datetime=start_time,
        end_datetime=end_time,
        client_latitude=client_loc.latitude if client_loc else None,
        client_longitude=client_loc.longitude if client_loc else None,
        client_address=client_loc.address if client_loc else None,
        stylist_latitude=stylist.service_latitude,
        stylist_longitude=stylist.service_longitude,
        distance_miles=distance_miles,
        service_price=service_price,
        travel_cost=travel_cost,
        platform_fee=platform_fee,
        platform_fee_percent=platform_fee_percent,
        stylist_earnings=stylist_earnings,
        total_price=total_price,
        estimated_duration_minutes=service_duration,
        notes=request.notes,
        travel_mode=travel_mode,
        meeting_location_address=meeting_loc.address if meeting_loc else None,
        meeting_location_lat=meeting_loc.latitude if meeting_loc else None,
        meeting_location_lng=meeting_loc.longitude if meeting_loc else None
    )
    
    db.add(new_booking)
    await db.commit()
    await db.refresh(new_booking)
    
    reminder_time = start_time - timedelta(hours=24)
    if reminder_time > datetime.now(timezone.utc):
        reminder = BookingReminder(
            booking_id=new_booking.booking_id,
            reminder_type="24hr",
            scheduled_at=reminder_time
        )
        db.add(reminder)
        await db.commit()
    
    return {
        "booking_id": new_booking.booking_id,
        "status": new_booking.status,
        "total_price": round(total_price, 2),
        "message": "Booking created successfully. Please proceed to payment."
    }

@router.get("/my-bookings")
async def get_my_bookings(user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    if user.role in ("client", "admin"):
        result = await db.execute(
            select(Booking)
            .options(selectinload(Booking.stylist).selectinload(Stylist.user))
            .where(Booking.client_id == user.user_id)
            .order_by(Booking.scheduled_datetime.desc())
        )
    else:
        stylist_result = await db.execute(select(Stylist).where(Stylist.user_id == user.user_id))
        stylist = stylist_result.scalar_one_or_none()
        if not stylist:
            return []
        
        result = await db.execute(
            select(Booking)
            .options(selectinload(Booking.client))
            .where(Booking.stylist_id == stylist.stylist_id)
            .order_by(Booking.scheduled_datetime.desc())
        )
    
    bookings = result.scalars().all()
    
    response = []
    for b in bookings:
        booking_data = {
            "booking_id": b.booking_id,
            "client_id": b.client_id,
            "stylist_id": b.stylist_id,
            "services": b.services,
            "scheduled_datetime": b.scheduled_datetime.isoformat() if b.scheduled_datetime else None,
            "status": b.status,
            "total_price": b.total_price,
            "travel_cost": b.travel_cost,
            "estimated_duration_minutes": b.estimated_duration_minutes,
            "travel_mode": b.travel_mode or "stylist_travels",
            "client_location": {
                "latitude": b.client_latitude,
                "longitude": b.client_longitude,
                "address": b.client_address
            } if b.client_address else None,
            "meeting_location": {
                "latitude": b.meeting_location_lat,
                "longitude": b.meeting_location_lng,
                "address": b.meeting_location_address
            } if b.meeting_location_address else None,
            "notes": b.notes,
            "created_at": b.created_at.isoformat() if b.created_at else None
        }
        
        if user.role == "client" and b.stylist and b.stylist.user:
            booking_data["stylist_name"] = b.stylist.user.name
        elif user.role == "stylist" and b.client:
            booking_data["client_name"] = b.client.name
        
        response.append(booking_data)
    
    return response

@router.put("/{booking_id}/status")
async def update_booking_status(booking_id: str, new_status: str, user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Booking).where(Booking.booking_id == booking_id))
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if user.role == "stylist":
        stylist_result = await db.execute(select(Stylist).where(Stylist.user_id == user.user_id))
        stylist = stylist_result.scalar_one_or_none()
        if not stylist or booking.stylist_id != stylist.stylist_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif booking.client_id != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    booking.status = new_status
    await db.commit()
    
    return {"booking_id": booking_id, "status": new_status}

@router.post("/{booking_id}/cancel")
async def cancel_booking(booking_id: str, reason: Optional[str] = None, user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Booking).where(Booking.booking_id == booking_id))
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if user.role == "stylist":
        stylist_result = await db.execute(select(Stylist).where(Stylist.user_id == user.user_id))
        stylist = stylist_result.scalar_one_or_none()
        if not stylist or booking.stylist_id != stylist.stylist_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif booking.client_id != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if booking.status == "completed":
        raise HTTPException(status_code=400, detail="Cannot cancel completed booking")
    
    booking.status = "cancelled"
    booking.cancellation_reason = reason
    booking.cancelled_by = user.user_id
    booking.cancelled_at = datetime.now(timezone.utc)
    
    await db.commit()
    
    return {"success": True, "message": "Booking cancelled"}

@router.post("/{booking_id}/extend")
async def extend_booking(booking_id: str, minutes: int, user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    if minutes not in [15, 30, 45, 60]:
        raise HTTPException(status_code=400, detail="Extension must be in 15-minute increments up to 60 minutes")
    
    result = await db.execute(select(Booking).where(Booking.booking_id == booking_id))
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status != "in_progress":
        raise HTTPException(status_code=400, detail="Can only extend in-progress bookings")
    
    authorized = False
    if user.role == "stylist":
        stylist_result = await db.execute(select(Stylist).where(Stylist.user_id == user.user_id))
        stylist = stylist_result.scalar_one_or_none()
        if stylist and booking.stylist_id == stylist.stylist_id:
            authorized = True
    elif booking.client_id == user.user_id:
        authorized = True
    
    if not authorized:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    booking.estimated_duration_minutes = (booking.estimated_duration_minutes or 60) + minutes
    booking.extension_minutes = (booking.extension_minutes or 0) + minutes
    booking.end_datetime = booking.end_datetime + timedelta(minutes=minutes)
    
    await db.commit()
    
    return {"success": True, "new_duration": booking.estimated_duration_minutes}
