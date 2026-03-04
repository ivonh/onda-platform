from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.db_models import User, Stylist, CancellationPolicy, Booking
from app.routes.auth import get_current_user_full
from datetime import datetime, timezone, timedelta
from typing import Optional

router = APIRouter(prefix="/cancellation", tags=["cancellation"])

class PolicyRequest(BaseModel):
    free_cancellation_hours: int = 24
    late_cancellation_fee_percent: float = 50.0
    no_show_fee_percent: float = 100.0
    policy_description: Optional[str] = None

class PolicyResponse(BaseModel):
    policy_id: str
    free_cancellation_hours: int
    late_cancellation_fee_percent: float
    no_show_fee_percent: float
    policy_description: Optional[str]

class CancellationFeeResponse(BaseModel):
    can_cancel_free: bool
    fee_percent: float
    fee_amount: float
    hours_until_appointment: float
    policy_description: Optional[str]

@router.get("/policy/{stylist_id}", response_model=PolicyResponse)
async def get_stylist_policy(stylist_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CancellationPolicy).where(CancellationPolicy.stylist_id == stylist_id)
    )
    policy = result.scalar_one_or_none()
    
    if not policy:
        return PolicyResponse(
            policy_id="default",
            free_cancellation_hours=24,
            late_cancellation_fee_percent=50.0,
            no_show_fee_percent=100.0,
            policy_description="Free cancellation up to 24 hours before your appointment. 50% fee for late cancellations. No refund for no-shows."
        )
    
    return PolicyResponse(
        policy_id=policy.policy_id,
        free_cancellation_hours=policy.free_cancellation_hours,
        late_cancellation_fee_percent=policy.late_cancellation_fee_percent,
        no_show_fee_percent=policy.no_show_fee_percent,
        policy_description=policy.policy_description
    )

@router.put("/policy")
async def update_policy(request: PolicyRequest, user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can update cancellation policies")
    
    stylist_result = await db.execute(
        select(Stylist).where(Stylist.user_id == user.user_id)
    )
    stylist = stylist_result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    result = await db.execute(
        select(CancellationPolicy).where(CancellationPolicy.stylist_id == stylist.stylist_id)
    )
    policy = result.scalar_one_or_none()
    
    if policy:
        policy.free_cancellation_hours = request.free_cancellation_hours
        policy.late_cancellation_fee_percent = request.late_cancellation_fee_percent
        policy.no_show_fee_percent = request.no_show_fee_percent
        policy.policy_description = request.policy_description
    else:
        policy = CancellationPolicy(
            stylist_id=stylist.stylist_id,
            free_cancellation_hours=request.free_cancellation_hours,
            late_cancellation_fee_percent=request.late_cancellation_fee_percent,
            no_show_fee_percent=request.no_show_fee_percent,
            policy_description=request.policy_description
        )
        db.add(policy)
    
    await db.commit()
    await db.refresh(policy)
    
    return {"success": True, "policy_id": policy.policy_id}

@router.get("/calculate-fee/{booking_id}", response_model=CancellationFeeResponse)
async def calculate_cancellation_fee(booking_id: str, user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    booking_result = await db.execute(
        select(Booking).where(Booking.booking_id == booking_id)
    )
    booking = booking_result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.client_id != user.user_id and user.role != "admin":
        stylist_result = await db.execute(
            select(Stylist).where(Stylist.user_id == user.user_id)
        )
        stylist = stylist_result.scalar_one_or_none()
        if not stylist or stylist.stylist_id != booking.stylist_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this booking")
    
    policy_result = await db.execute(
        select(CancellationPolicy).where(CancellationPolicy.stylist_id == booking.stylist_id)
    )
    policy = policy_result.scalar_one_or_none()
    
    free_hours = policy.free_cancellation_hours if policy else 24
    late_fee_percent = policy.late_cancellation_fee_percent if policy else 50.0
    policy_desc = policy.policy_description if policy else None
    
    now = datetime.now(timezone.utc)
    time_until = booking.scheduled_datetime - now
    hours_until = time_until.total_seconds() / 3600
    
    if hours_until >= free_hours:
        return CancellationFeeResponse(
            can_cancel_free=True,
            fee_percent=0,
            fee_amount=0,
            hours_until_appointment=hours_until,
            policy_description=policy_desc
        )
    elif hours_until > 0:
        fee_amount = booking.total_price * (late_fee_percent / 100)
        return CancellationFeeResponse(
            can_cancel_free=False,
            fee_percent=late_fee_percent,
            fee_amount=fee_amount,
            hours_until_appointment=hours_until,
            policy_description=policy_desc
        )
    else:
        no_show_percent = policy.no_show_fee_percent if policy else 100.0
        fee_amount = booking.total_price * (no_show_percent / 100)
        return CancellationFeeResponse(
            can_cancel_free=False,
            fee_percent=no_show_percent,
            fee_amount=fee_amount,
            hours_until_appointment=hours_until,
            policy_description=policy_desc
        )
