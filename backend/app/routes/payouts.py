from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.database import get_db
from app.models.db_models import User, Stylist, Booking, StylistPayoutSettings, PayoutTransaction
from app.routes.auth import get_current_user_full
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payouts", tags=["payouts"])


class PayoutSettingsUpdate(BaseModel):
    payout_frequency: Optional[str] = None
    bank_account_last4: Optional[str] = None
    bank_name: Optional[str] = None
    bsb: Optional[str] = None


class PayoutSettingsResponse(BaseModel):
    payout_frequency: str
    bank_account_last4: Optional[str]
    bank_name: Optional[str]
    bsb: Optional[str]
    is_verified: bool
    total_earnings: float
    pending_balance: float
    last_payout_at: Optional[datetime]
    next_payout_at: Optional[datetime]


@router.get("/settings")
async def get_payout_settings(user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can access payout settings")
    
    stylist_result = await db.execute(select(Stylist).where(Stylist.user_id == user.user_id))
    stylist = stylist_result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    settings_result = await db.execute(
        select(StylistPayoutSettings).where(StylistPayoutSettings.stylist_id == stylist.stylist_id)
    )
    settings = settings_result.scalar_one_or_none()
    
    if not settings:
        settings = StylistPayoutSettings(stylist_id=stylist.stylist_id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    
    return {
        "payout_frequency": settings.payout_frequency,
        "bank_account_last4": settings.bank_account_last4,
        "bank_name": settings.bank_name,
        "bsb": settings.bsb,
        "is_verified": settings.is_verified,
        "total_earnings": settings.total_earnings or 0.0,
        "pending_balance": settings.pending_balance or 0.0,
        "last_payout_at": settings.last_payout_at,
        "next_payout_at": settings.next_payout_at
    }


@router.put("/settings")
async def update_payout_settings(
    update: PayoutSettingsUpdate,
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can update payout settings")
    
    stylist_result = await db.execute(select(Stylist).where(Stylist.user_id == user.user_id))
    stylist = stylist_result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    settings_result = await db.execute(
        select(StylistPayoutSettings).where(StylistPayoutSettings.stylist_id == stylist.stylist_id)
    )
    settings = settings_result.scalar_one_or_none()
    
    if not settings:
        settings = StylistPayoutSettings(stylist_id=stylist.stylist_id)
        db.add(settings)
    
    if update.payout_frequency:
        if update.payout_frequency not in ["instant", "daily", "weekly", "monthly"]:
            raise HTTPException(status_code=400, detail="Invalid payout frequency")
        settings.payout_frequency = update.payout_frequency
        settings.next_payout_at = calculate_next_payout(update.payout_frequency)
    
    if update.bank_account_last4:
        settings.bank_account_last4 = update.bank_account_last4[-4:]
    
    if update.bank_name:
        settings.bank_name = update.bank_name
    
    if update.bsb:
        settings.bsb = update.bsb
    
    if update.bank_account_last4 and update.bsb and update.bank_name:
        settings.is_verified = True
    
    await db.commit()
    await db.refresh(settings)
    
    return {
        "message": "Payout settings updated successfully",
        "payout_frequency": settings.payout_frequency,
        "is_verified": settings.is_verified,
        "next_payout_at": settings.next_payout_at
    }


@router.get("/earnings-summary")
async def get_earnings_summary(user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can access earnings")
    
    stylist_result = await db.execute(select(Stylist).where(Stylist.user_id == user.user_id))
    stylist = stylist_result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    completed_bookings = await db.execute(
        select(Booking).where(
            and_(
                Booking.stylist_id == stylist.stylist_id,
                Booking.status == "completed",
                Booking.payment_status == "completed"
            )
        )
    )
    bookings = completed_bookings.scalars().all()
    
    total_revenue = sum(b.total_price for b in bookings)
    total_service_fees = sum(b.service_price for b in bookings)
    total_travel_fees = sum(b.travel_cost or 0 for b in bookings)
    total_platform_fees = sum(b.platform_fee or 0 for b in bookings)
    total_earnings = sum(b.stylist_earnings or (b.total_price - (b.platform_fee or 0)) for b in bookings)
    
    settings_result = await db.execute(
        select(StylistPayoutSettings).where(StylistPayoutSettings.stylist_id == stylist.stylist_id)
    )
    settings = settings_result.scalar_one_or_none()
    
    pending_payouts = await db.execute(
        select(PayoutTransaction).where(
            and_(
                PayoutTransaction.stylist_id == stylist.stylist_id,
                PayoutTransaction.status == "pending"
            )
        )
    )
    pending = pending_payouts.scalars().all()
    pending_amount = sum(p.net_amount for p in pending)
    
    return {
        "total_bookings": len(bookings),
        "total_revenue": round(total_revenue, 2),
        "total_service_fees": round(total_service_fees, 2),
        "total_travel_fees": round(total_travel_fees, 2),
        "total_platform_fees": round(total_platform_fees, 2),
        "total_earnings": round(total_earnings, 2),
        "pending_payout_amount": round(pending_amount, 2),
        "payout_frequency": settings.payout_frequency if settings else "weekly",
        "next_payout_at": settings.next_payout_at if settings else None,
        "is_payout_verified": settings.is_verified if settings else False
    }


@router.get("/transactions")
async def get_payout_transactions(
    limit: int = 20,
    offset: int = 0,
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can access transactions")
    
    stylist_result = await db.execute(select(Stylist).where(Stylist.user_id == user.user_id))
    stylist = stylist_result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    transactions = await db.execute(
        select(PayoutTransaction)
        .where(PayoutTransaction.stylist_id == stylist.stylist_id)
        .order_by(PayoutTransaction.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    
    return [
        {
            "transaction_id": t.transaction_id,
            "amount": t.amount,
            "fee": t.fee,
            "net_amount": t.net_amount,
            "status": t.status,
            "payout_method": t.payout_method,
            "processed_at": t.processed_at,
            "created_at": t.created_at
        }
        for t in transactions.scalars().all()
    ]


def calculate_next_payout(frequency: str) -> datetime:
    now = datetime.now(timezone.utc)
    
    if frequency == "instant":
        return now
    elif frequency == "daily":
        return now + timedelta(days=1)
    elif frequency == "weekly":
        days_until_monday = (7 - now.weekday()) % 7 or 7
        return now + timedelta(days=days_until_monday)
    elif frequency == "monthly":
        if now.month == 12:
            return datetime(now.year + 1, 1, 1, tzinfo=timezone.utc)
        return datetime(now.year, now.month + 1, 1, tzinfo=timezone.utc)
    return now + timedelta(days=7)
