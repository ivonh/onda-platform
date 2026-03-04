from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.db_models import User, Stylist
from app.routes.auth import get_current_user_full
from typing import Optional

router = APIRouter(prefix="/portfolio", tags=["portfolio"])

class CommentCreate(BaseModel):
    photo_id: str
    comment: str

@router.post("/photos/upload")
async def upload_photo_url(photo_url: str, description: Optional[str] = None, user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can upload photos")
    
    result = await db.execute(select(Stylist).where(Stylist.user_id == user.user_id))
    stylist = result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    existing_photos = stylist.portfolio_images or []
    if len(existing_photos) >= 1000:
        raise HTTPException(status_code=400, detail="Maximum 1000 photos allowed")
    
    existing_photos.append(photo_url)
    stylist.portfolio_images = existing_photos
    await db.commit()
    
    return {"photo_id": str(len(existing_photos)), "message": "Photo added successfully"}

@router.get("/stylist/{stylist_id}/photos")
async def get_stylist_photos(stylist_id: str, skip: int = 0, limit: int = 20, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Stylist).where(Stylist.stylist_id == stylist_id))
    stylist = result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist not found")
    
    photos = stylist.portfolio_images or []
    return [
        {"photo_id": str(i), "url": url, "description": None}
        for i, url in enumerate(photos[skip:skip+limit], start=skip)
    ]

@router.post("/photos/{photo_id}/comment")
async def add_comment(photo_id: str, request: CommentCreate, user: User = Depends(get_current_user_full)):
    return {"comment_id": "placeholder", "message": "Comment added"}

@router.get("/photos/{photo_id}/comments")
async def get_photo_comments(photo_id: str, limit: int = 50):
    return []

@router.post("/photos/{photo_id}/like")
async def like_photo(photo_id: str, user: User = Depends(get_current_user_full)):
    return {"liked": True}
