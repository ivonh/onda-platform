from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.db_models import User, Rating, ReviewPhoto
from app.routes.auth import get_current_user_full
from datetime import datetime, timezone
from typing import List, Optional
import base64
import uuid

router = APIRouter(prefix="/review-photos", tags=["review_photos"])

class PhotoUploadRequest(BaseModel):
    rating_id: str
    photo_data: str
    photo_type: str = "after"

class PhotoResponse(BaseModel):
    photo_id: str
    photo_url: str
    photo_type: str
    is_approved: bool
    created_at: datetime

@router.post("/upload")
async def upload_review_photo(
    request: PhotoUploadRequest,
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    rating_result = await db.execute(
        select(Rating).where(Rating.rating_id == request.rating_id)
    )
    rating = rating_result.scalar_one_or_none()
    
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    
    if rating.user_id != user.user_id:
        raise HTTPException(status_code=403, detail="You can only add photos to your own reviews")
    
    existing_photos = await db.execute(
        select(ReviewPhoto).where(ReviewPhoto.rating_id == request.rating_id)
    )
    photo_count = len(existing_photos.scalars().all())
    
    if photo_count >= 5:
        raise HTTPException(status_code=400, detail="Maximum 5 photos per review")
    
    if request.photo_type not in ["before", "after"]:
        raise HTTPException(status_code=400, detail="Photo type must be 'before' or 'after'")
    
    photo_id = str(uuid.uuid4())
    photo_url = f"/uploads/reviews/{photo_id}.jpg"
    
    photo = ReviewPhoto(
        rating_id=request.rating_id,
        photo_url=photo_url,
        photo_type=request.photo_type,
        is_moderated=False,
        is_approved=False
    )
    db.add(photo)
    await db.commit()
    await db.refresh(photo)
    
    return {
        "success": True,
        "photo_id": photo.photo_id,
        "photo_url": photo_url,
        "message": "Photo uploaded and pending moderation"
    }

@router.get("/rating/{rating_id}", response_model=List[PhotoResponse])
async def get_rating_photos(rating_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ReviewPhoto)
        .where(ReviewPhoto.rating_id == rating_id)
        .where(ReviewPhoto.is_approved == True)
    )
    photos = result.scalars().all()
    
    return [
        PhotoResponse(
            photo_id=p.photo_id,
            photo_url=p.photo_url,
            photo_type=p.photo_type,
            is_approved=p.is_approved,
            created_at=p.created_at
        )
        for p in photos
    ]

@router.get("/pending")
async def get_pending_photos(
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view pending photos")
    
    result = await db.execute(
        select(ReviewPhoto).where(ReviewPhoto.is_moderated == False)
    )
    photos = result.scalars().all()
    
    pending = []
    for photo in photos:
        rating_result = await db.execute(
            select(Rating).where(Rating.rating_id == photo.rating_id)
        )
        rating = rating_result.scalar_one_or_none()
        
        user_result = await db.execute(
            select(User).where(User.user_id == rating.user_id)
        ) if rating else None
        photo_user = user_result.scalar_one_or_none() if user_result else None
        
        pending.append({
            "photo_id": photo.photo_id,
            "photo_url": photo.photo_url,
            "photo_type": photo.photo_type,
            "uploaded_by": photo_user.name if photo_user else "Unknown",
            "rating_id": photo.rating_id,
            "created_at": photo.created_at.isoformat()
        })
    
    return pending

@router.post("/moderate/{photo_id}")
async def moderate_photo(
    photo_id: str,
    approved: bool,
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can moderate photos")
    
    result = await db.execute(
        select(ReviewPhoto).where(ReviewPhoto.photo_id == photo_id)
    )
    photo = result.scalar_one_or_none()
    
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    photo.is_moderated = True
    photo.is_approved = approved
    photo.moderated_at = datetime.now(timezone.utc)
    photo.moderated_by = user.user_id
    
    await db.commit()
    
    return {
        "success": True,
        "photo_id": photo_id,
        "approved": approved
    }

@router.delete("/{photo_id}")
async def delete_photo(
    photo_id: str,
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ReviewPhoto).where(ReviewPhoto.photo_id == photo_id)
    )
    photo = result.scalar_one_or_none()
    
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    rating_result = await db.execute(
        select(Rating).where(Rating.rating_id == photo.rating_id)
    )
    rating = rating_result.scalar_one_or_none()
    
    if rating and rating.user_id != user.user_id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this photo")
    
    await db.delete(photo)
    await db.commit()
    
    return {"success": True, "message": "Photo deleted"}
