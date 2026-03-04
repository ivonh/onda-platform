from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.db_models import User, Stylist, Booking, BlockedTime
from app.routes.auth import get_current_user_full
from datetime import datetime, timezone
from typing import List, Optional

router = APIRouter(prefix="/availability", tags=["availability"])

class AvailabilitySlot(BaseModel):
    day_of_week: int
    start_time: str
    end_time: str
    is_available: bool = True

class SetAvailabilityRequest(BaseModel):
    slots: List[AvailabilitySlot]

class BlockTimeRequest(BaseModel):
    start_datetime: str
    end_datetime: str
    reason: Optional[str] = None

@router.post("/set")
async def set_availability(request: SetAvailabilityRequest, user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can set availability")
    
    result = await db.execute(select(Stylist).where(Stylist.user_id == user.user_id))
    stylist = result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    stylist.availability_slots = [s.model_dump() for s in request.slots]
    await db.commit()
    
    return {"success": True, "message": "Availability updated"}

@router.post("/block-time")
async def block_time(request: BlockTimeRequest, user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can block time")
    
    result = await db.execute(select(Stylist).where(Stylist.user_id == user.user_id))
    stylist = result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    new_block = BlockedTime(
        stylist_id=stylist.stylist_id,
        start_datetime=datetime.fromisoformat(request.start_datetime.replace('Z', '+00:00')),
        end_datetime=datetime.fromisoformat(request.end_datetime.replace('Z', '+00:00')),
        reason=request.reason
    )
    
    db.add(new_block)
    await db.commit()
    await db.refresh(new_block)
    
    return {"block_id": new_block.block_id, "message": "Time blocked successfully"}

@router.get("/stylist/{stylist_id}")
async def get_stylist_availability(stylist_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Stylist)
        .options(selectinload(Stylist.blocked_times))
        .where(Stylist.stylist_id == stylist_id)
    )
    stylist = result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist not found")
    
    return {
        "availability_slots": stylist.availability_slots or [],
        "blocked_times": [
            {
                "block_id": b.block_id,
                "start_datetime": b.start_datetime.isoformat() if b.start_datetime else None,
                "end_datetime": b.end_datetime.isoformat() if b.end_datetime else None,
                "reason": b.reason
            }
            for b in stylist.blocked_times
        ]
    }

@router.get("/my-calendar")
async def get_my_calendar(user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can view calendar")
    
    result = await db.execute(
        select(Stylist)
        .options(selectinload(Stylist.blocked_times))
        .where(Stylist.user_id == user.user_id)
    )
    stylist = result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    bookings_result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.client))
        .where(Booking.stylist_id == stylist.stylist_id)
        .order_by(Booking.scheduled_datetime)
    )
    bookings = bookings_result.scalars().all()
    
    return {
        "bookings": [
            {
                "booking_id": b.booking_id,
                "client_name": b.client.name if b.client else "Unknown",
                "services": b.services,
                "scheduled_datetime": b.scheduled_datetime.isoformat() if b.scheduled_datetime else None,
                "status": b.status,
                "estimated_duration_minutes": b.estimated_duration_minutes,
                "client_location": {
                    "latitude": b.client_latitude,
                    "longitude": b.client_longitude,
                    "address": b.client_address
                }
            }
            for b in bookings
        ],
        "blocked_times": [
            {
                "block_id": bt.block_id,
                "start_datetime": bt.start_datetime.isoformat() if bt.start_datetime else None,
                "end_datetime": bt.end_datetime.isoformat() if bt.end_datetime else None,
                "reason": bt.reason
            }
            for bt in stylist.blocked_times
        ],
        "availability_slots": stylist.availability_slots or []
    }

@router.delete("/block-time/{block_id}")
async def delete_blocked_time(block_id: str, user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can delete blocked time")
    
    result = await db.execute(select(Stylist).where(Stylist.user_id == user.user_id))
    stylist = result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    block_result = await db.execute(
        select(BlockedTime).where(
            BlockedTime.block_id == block_id,
            BlockedTime.stylist_id == stylist.stylist_id
        )
    )
    block = block_result.scalar_one_or_none()
    
    if not block:
        raise HTTPException(status_code=404, detail="Blocked time not found")
    
    await db.delete(block)
    await db.commit()
    
    return {"success": True, "message": "Blocked time removed"}
