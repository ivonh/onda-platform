from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.db_models import User, Stylist, Booking
from app.routes.auth import get_current_user_full

router = APIRouter(prefix="/quick-rebook", tags=["quick-rebook"])

@router.get("/history")
async def get_booking_history(limit: int = 10, user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    if user.role != "client":
        raise HTTPException(status_code=403, detail="Only clients can view booking history")
    
    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.stylist).selectinload(Stylist.user))
        .where(Booking.client_id == user.user_id, Booking.payment_status == "completed")
        .order_by(Booking.scheduled_datetime.desc())
        .limit(limit)
    )
    bookings = result.scalars().all()
    
    history = []
    for booking in bookings:
        stylist = booking.stylist
        if stylist and stylist.user:
            history.append({
                "booking_id": booking.booking_id,
                "stylist_id": booking.stylist_id,
                "stylist_name": stylist.user.name,
                "stylist_photo": stylist.portfolio_images[0] if stylist.portfolio_images else None,
                "stylist_hearts": (stylist.total_ratings or 0) * (stylist.average_rating or 0),
                "stylist_rating": stylist.average_rating or 0,
                "services": booking.services,
                "service_price": booking.service_price,
                "total_price": booking.total_price,
                "client_location": {
                    "latitude": booking.client_latitude,
                    "longitude": booking.client_longitude,
                    "address": booking.client_address
                },
                "scheduled_datetime": booking.scheduled_datetime.isoformat() if booking.scheduled_datetime else None,
                "notes": booking.notes or ""
            })
    
    return history

@router.get("/favorites-stylists")
async def get_favorite_stylists_for_rebook(user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    if user.role != "client":
        raise HTTPException(status_code=403, detail="Only clients can view this")
    
    result = await db.execute(
        select(
            Booking.stylist_id,
            func.count(Booking.id).label('booking_count'),
            func.max(Booking.scheduled_datetime).label('last_booking'),
            func.sum(Booking.total_price).label('total_spent')
        )
        .where(Booking.client_id == user.user_id, Booking.payment_status == "completed")
        .group_by(Booking.stylist_id)
        .order_by(desc('booking_count'))
        .limit(5)
    )
    
    items = result.all()
    
    favorites = []
    for item in items:
        stylist_result = await db.execute(
            select(Stylist)
            .options(selectinload(Stylist.user))
            .where(Stylist.stylist_id == item.stylist_id)
        )
        stylist = stylist_result.scalar_one_or_none()
        
        if stylist and stylist.user:
            favorites.append({
                "stylist_id": item.stylist_id,
                "stylist_name": stylist.user.name,
                "stylist_photo": stylist.portfolio_images[0] if stylist.portfolio_images else None,
                "stylist_hearts": (stylist.total_ratings or 0) * (stylist.average_rating or 0),
                "stylist_rating": stylist.average_rating or 0,
                "booking_count": item.booking_count,
                "last_booking": item.last_booking.isoformat() if item.last_booking else None,
                "total_spent": float(item.total_spent) if item.total_spent else 0
            })
    
    return favorites
