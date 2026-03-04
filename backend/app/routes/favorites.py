from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.db_models import User, Stylist, Favorite
from app.routes.auth import get_current_user_full

router = APIRouter(prefix="/favorites", tags=["favorites"])

@router.post("/add/{stylist_id}")
async def add_favorite(stylist_id: str, user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Stylist).where(Stylist.stylist_id == stylist_id))
    stylist = result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist not found")
    
    existing = await db.execute(
        select(Favorite).where(
            Favorite.user_id == user.user_id,
            Favorite.stylist_id == stylist_id
        )
    )
    
    if existing.scalar_one_or_none():
        return {"message": "Already in favorites", "is_favorite": True}
    
    new_favorite = Favorite(
        user_id=user.user_id,
        stylist_id=stylist_id
    )
    
    try:
        db.add(new_favorite)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        return {"message": "Already in favorites", "is_favorite": True}
    
    return {"message": "Added to favorites", "is_favorite": True}

@router.delete("/remove/{stylist_id}")
async def remove_favorite(stylist_id: str, user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Favorite).where(
            Favorite.user_id == user.user_id,
            Favorite.stylist_id == stylist_id
        )
    )
    favorite = result.scalar_one_or_none()
    
    if not favorite:
        raise HTTPException(status_code=404, detail="Not in favorites")
    
    await db.delete(favorite)
    await db.commit()
    
    return {"message": "Removed from favorites", "is_favorite": False}

@router.get("/my-favorites")
async def get_my_favorites(user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Favorite).where(Favorite.user_id == user.user_id)
    )
    favorites = result.scalars().all()
    
    stylist_ids = [f.stylist_id for f in favorites]
    
    stylists_result = await db.execute(
        select(Stylist)
        .options(selectinload(Stylist.user), selectinload(Stylist.pricing))
        .where(Stylist.stylist_id.in_(stylist_ids))
    )
    stylists = stylists_result.scalars().all()
    
    return [
        {
            "stylist_id": s.stylist_id,
            "name": s.user.name if s.user else "Unknown",
            "email": s.user.email if s.user else None,
            "bio": s.bio,
            "skills": s.skills or [],
            "years_experience": s.years_experience,
            "average_rating": s.average_rating,
            "total_ratings": s.total_ratings,
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
            "portfolio_images": s.portfolio_images or []
        }
        for s in stylists
    ]

@router.get("/check/{stylist_id}")
async def check_favorite(stylist_id: str, user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Favorite).where(
            Favorite.user_id == user.user_id,
            Favorite.stylist_id == stylist_id
        )
    )
    
    return {"is_favorite": result.scalar_one_or_none() is not None}
