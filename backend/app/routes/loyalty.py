from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models.db_models import User, LoyaltyPoints, LoyaltyTransaction, Referral
from app.routes.auth import get_current_user_full
from datetime import datetime, timezone
from typing import List, Optional
import secrets
import string

router = APIRouter(prefix="/loyalty", tags=["loyalty"])

POINTS_PER_DOLLAR = 10
REFERRAL_BONUS_POINTS = 500
TIER_THRESHOLDS = {
    "bronze": 0,
    "silver": 1000,
    "gold": 5000,
    "platinum": 15000
}
TIER_DISCOUNTS = {
    "bronze": 0,
    "silver": 5,
    "gold": 10,
    "platinum": 15
}

class LoyaltyResponse(BaseModel):
    total_points: int
    lifetime_points: int
    tier: str
    tier_discount_percent: int
    points_to_next_tier: int
    next_tier: Optional[str]
    referral_code: str

class RedeemRequest(BaseModel):
    points: int

class TransactionResponse(BaseModel):
    transaction_id: str
    points: int
    transaction_type: str
    description: Optional[str]
    created_at: datetime

def generate_referral_code(length: int = 8) -> str:
    chars = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))

def calculate_tier(lifetime_points: int) -> str:
    tier = "bronze"
    for tier_name, threshold in sorted(TIER_THRESHOLDS.items(), key=lambda x: x[1], reverse=True):
        if lifetime_points >= threshold:
            tier = tier_name
            break
    return tier

def get_next_tier_info(lifetime_points: int) -> tuple:
    current_tier = calculate_tier(lifetime_points)
    tiers = list(TIER_THRESHOLDS.keys())
    current_idx = tiers.index(current_tier)
    
    if current_idx >= len(tiers) - 1:
        return None, 0
    
    next_tier = tiers[current_idx + 1]
    points_needed = TIER_THRESHOLDS[next_tier] - lifetime_points
    return next_tier, max(0, points_needed)

async def get_or_create_loyalty(user_id: str, db: AsyncSession) -> LoyaltyPoints:
    result = await db.execute(
        select(LoyaltyPoints).where(LoyaltyPoints.user_id == user_id)
    )
    loyalty = result.scalar_one_or_none()
    
    if not loyalty:
        loyalty = LoyaltyPoints(user_id=user_id, total_points=0, lifetime_points=0)
        db.add(loyalty)
        await db.commit()
        await db.refresh(loyalty)
    
    return loyalty

async def award_points(user_id: str, points: int, transaction_type: str, description: str, reference_id: str, db: AsyncSession) -> LoyaltyPoints:
    loyalty = await get_or_create_loyalty(user_id, db)
    
    loyalty.total_points += points
    loyalty.lifetime_points += points
    loyalty.tier = calculate_tier(loyalty.lifetime_points)
    
    transaction = LoyaltyTransaction(
        loyalty_id=loyalty.id,
        points=points,
        transaction_type=transaction_type,
        description=description,
        reference_id=reference_id
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(loyalty)
    
    return loyalty

@router.get("/", response_model=LoyaltyResponse)
async def get_loyalty_status(user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    loyalty = await get_or_create_loyalty(user.user_id, db)
    
    referral_result = await db.execute(
        select(Referral).where(Referral.referrer_id == user.user_id).limit(1)
    )
    existing_referral = referral_result.scalar_one_or_none()
    
    if existing_referral:
        referral_code = existing_referral.referral_code
    else:
        referral_code = generate_referral_code()
    
    next_tier, points_to_next = get_next_tier_info(loyalty.lifetime_points)
    
    return LoyaltyResponse(
        total_points=loyalty.total_points,
        lifetime_points=loyalty.lifetime_points,
        tier=loyalty.tier,
        tier_discount_percent=TIER_DISCOUNTS.get(loyalty.tier, 0),
        points_to_next_tier=points_to_next,
        next_tier=next_tier,
        referral_code=referral_code
    )

@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(limit: int = 20, user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    loyalty = await get_or_create_loyalty(user.user_id, db)
    
    result = await db.execute(
        select(LoyaltyTransaction)
        .where(LoyaltyTransaction.loyalty_id == loyalty.id)
        .order_by(desc(LoyaltyTransaction.created_at))
        .limit(limit)
    )
    transactions = result.scalars().all()
    
    return [
        TransactionResponse(
            transaction_id=t.transaction_id,
            points=t.points,
            transaction_type=t.transaction_type,
            description=t.description,
            created_at=t.created_at
        )
        for t in transactions
    ]

@router.post("/redeem")
async def redeem_points(request: RedeemRequest, user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    if request.points <= 0:
        raise HTTPException(status_code=400, detail="Points must be greater than 0")
    
    loyalty = await get_or_create_loyalty(user.user_id, db)
    
    if loyalty.total_points < request.points:
        raise HTTPException(status_code=400, detail="Insufficient points")
    
    discount_value = request.points / 100
    
    loyalty.total_points -= request.points
    
    transaction = LoyaltyTransaction(
        loyalty_id=loyalty.id,
        points=-request.points,
        transaction_type="redemption",
        description=f"Redeemed for ${discount_value:.2f} discount"
    )
    db.add(transaction)
    await db.commit()
    
    return {
        "success": True,
        "points_redeemed": request.points,
        "discount_value": discount_value,
        "remaining_points": loyalty.total_points
    }

@router.post("/apply-referral/{code}")
async def apply_referral_code(code: str, user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(Referral).where(Referral.referred_id == user.user_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You have already used a referral code")
    
    referrer_result = await db.execute(
        select(Referral).where(Referral.referral_code == code.upper())
    )
    referrer_ref = referrer_result.scalar_one_or_none()
    
    if not referrer_ref:
        referrer_result = await db.execute(
            select(LoyaltyPoints)
            .join(User, User.user_id == LoyaltyPoints.user_id)
            .where(User.user_id != user.user_id)
            .limit(1)
        )
        referrer_loyalty = referrer_result.scalar_one_or_none()
        if not referrer_loyalty:
            raise HTTPException(status_code=404, detail="Invalid referral code")
        referrer_id = referrer_loyalty.user_id
    else:
        referrer_id = referrer_ref.referrer_id
    
    if referrer_id == user.user_id:
        raise HTTPException(status_code=400, detail="You cannot refer yourself")
    
    referral = Referral(
        referrer_id=referrer_id,
        referred_id=user.user_id,
        referral_code=code.upper(),
        status="pending"
    )
    db.add(referral)
    
    await award_points(
        user.user_id, 
        REFERRAL_BONUS_POINTS // 2,
        "referral_bonus",
        "Welcome bonus for using referral code",
        referral.referral_id,
        db
    )
    
    await db.commit()
    
    return {
        "success": True,
        "message": f"Referral code applied! You earned {REFERRAL_BONUS_POINTS // 2} bonus points.",
        "points_earned": REFERRAL_BONUS_POINTS // 2
    }
