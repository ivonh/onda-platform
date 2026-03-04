from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.database import get_db
from app.models.db_models import User, CouponCode
from app.routes.auth import get_current_user_full
from datetime import datetime, timezone
from typing import Optional

router = APIRouter(prefix="/coupons", tags=["coupons"])


class RedeemCouponRequest(BaseModel):
    code: str
    booking_id: Optional[str] = None


@router.get("/validate/{code}")
async def validate_coupon(
    code: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CouponCode).where(CouponCode.code == code)
    )
    coupon = result.scalar_one_or_none()

    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon code not found")

    if not coupon.is_active:
        raise HTTPException(status_code=400, detail="Coupon code is no longer active")

    if coupon.is_used:
        raise HTTPException(status_code=400, detail="Coupon code has already been used")

    if coupon.expires_at and coupon.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Coupon code has expired")

    return {
        "valid": True,
        "coupon_code": coupon.code,
        "discount_percent": coupon.discount_percent,
        "stylist_name": coupon.stylist_name,
        "before_photo_url": coupon.before_photo_url,
        "after_photo_url": coupon.after_photo_url,
        "service_description": coupon.service_description,
        "expires_at": coupon.expires_at.isoformat() if coupon.expires_at else None
    }


@router.post("/redeem")
async def redeem_coupon(
    request: RedeemCouponRequest,
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CouponCode).where(CouponCode.code == request.code)
    )
    coupon = result.scalar_one_or_none()

    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon code not found")

    if not coupon.is_active:
        raise HTTPException(status_code=400, detail="Coupon code is no longer active")

    if coupon.is_used:
        raise HTTPException(status_code=400, detail="Coupon code has already been used")

    if coupon.expires_at and coupon.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Coupon code has expired")

    coupon.is_used = True
    coupon.used_by_user_id = user.user_id
    coupon.used_at = datetime.now(timezone.utc)
    coupon.used_on_booking_id = request.booking_id

    await db.commit()

    return {
        "success": True,
        "message": "Coupon redeemed successfully",
        "discount_percent": coupon.discount_percent
    }


@router.get("/marketing-cards/{stylist_id}")
async def get_marketing_cards(
    stylist_id: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CouponCode).where(
            and_(
                CouponCode.stylist_id == stylist_id,
                CouponCode.is_active == True,
                CouponCode.before_photo_url.isnot(None),
                CouponCode.after_photo_url.isnot(None)
            )
        )
        .order_by(CouponCode.created_at.desc())
    )
    coupons = result.scalars().all()

    return {
        "marketing_cards": [
            {
                "coupon_code": c.code,
                "discount_percent": c.discount_percent,
                "stylist_name": c.stylist_name,
                "before_photo_url": c.before_photo_url,
                "after_photo_url": c.after_photo_url,
                "service_description": c.service_description,
                "expires_at": c.expires_at.isoformat() if c.expires_at else None
            }
            for c in coupons
        ],
        "count": len(coupons)
    }


@router.get("/my-coupons")
async def get_my_coupons(
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CouponCode).where(
            and_(
                CouponCode.generated_for_user_id == user.user_id,
                CouponCode.is_active == True,
                CouponCode.is_used == False
            )
        )
        .order_by(CouponCode.created_at.desc())
    )
    coupons = result.scalars().all()

    now = datetime.now(timezone.utc)

    return {
        "coupons": [
            {
                "coupon_code": c.code,
                "discount_percent": c.discount_percent,
                "stylist_name": c.stylist_name,
                "before_photo_url": c.before_photo_url,
                "after_photo_url": c.after_photo_url,
                "service_description": c.service_description,
                "expires_at": c.expires_at.isoformat() if c.expires_at else None,
                "is_expired": c.expires_at < now if c.expires_at else False
            }
            for c in coupons
        ],
        "count": len(coupons)
    }
