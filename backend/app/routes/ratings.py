from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.db_models import User, Stylist, Booking, Rating
from app.routes.auth import get_current_user_full
from typing import Optional

router = APIRouter(prefix="/ratings", tags=["ratings"])

class RatingCreate(BaseModel):
    booking_id: str
    rating: int
    feedback: Optional[str] = None

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_rating(rating_data: RatingCreate, user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    if rating_data.rating < 1 or rating_data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    result = await db.execute(select(Booking).where(Booking.booking_id == rating_data.booking_id))
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.client_id != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if booking.status != "completed":
        raise HTTPException(status_code=400, detail="Can only rate completed bookings")
    
    existing = await db.execute(select(Rating).where(Rating.booking_id == rating_data.booking_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Booking already rated")
    
    new_rating = Rating(
        booking_id=rating_data.booking_id,
        user_id=user.user_id,
        stylist_id=booking.stylist_id,
        rating=rating_data.rating,
        feedback=rating_data.feedback
    )
    
    db.add(new_rating)
    await db.flush()
    
    avg_result = await db.execute(
        select(func.avg(Rating.rating), func.count(Rating.id))
        .where(Rating.stylist_id == booking.stylist_id)
    )
    avg_rating, total_ratings = avg_result.one()
    
    stylist_result = await db.execute(select(Stylist).where(Stylist.stylist_id == booking.stylist_id))
    stylist = stylist_result.scalar_one_or_none()
    if stylist:
        stylist.average_rating = float(avg_rating) if avg_rating else 0.0
        stylist.total_ratings = total_ratings or 0
    
    await db.commit()
    
    return {"rating_id": new_rating.rating_id, "message": "Rating submitted successfully"}

@router.get("/stylist/{stylist_id}")
async def get_stylist_ratings(stylist_id: str, limit: int = 20, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Rating)
        .options(selectinload(Rating.user))
        .where(Rating.stylist_id == stylist_id)
        .order_by(Rating.created_at.desc())
        .limit(limit)
    )
    ratings = result.scalars().all()
    
    return [
        {
            "rating_id": r.rating_id,
            "rating": r.rating,
            "feedback": r.feedback,
            "client_name": r.user.name if r.user else "Anonymous",
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in ratings
    ]
