from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.db_models import User, Stylist, Booking, Withdrawal, TaxInfo
from app.routes.auth import get_current_user_full
from datetime import datetime, timezone
from typing import Optional
import uuid

router = APIRouter(prefix="/stylist", tags=["stylist-features"])

class WithdrawalRequest(BaseModel):
    amount: float

class TaxInfoUpdate(BaseModel):
    tax_id: str
    business_name: Optional[str] = None
    address: str
    city: str
    state: str
    zip_code: str

@router.get("/earnings")
async def get_earnings(user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can view earnings")
    
    result = await db.execute(select(Stylist).where(Stylist.user_id == user.user_id))
    stylist = result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    earnings_result = await db.execute(
        select(func.sum(Booking.total_price), func.count(Booking.id))
        .where(Booking.stylist_id == stylist.stylist_id, Booking.payment_status == "completed")
    )
    total, count = earnings_result.one()
    total_earnings = (total or 0) * 0.80
    
    withdrawn_result = await db.execute(
        select(func.sum(Withdrawal.amount))
        .where(Withdrawal.stylist_id == stylist.stylist_id, Withdrawal.status == "approved")
    )
    total_withdrawn = withdrawn_result.scalar() or 0
    
    available_balance = total_earnings - total_withdrawn
    
    return {
        "total_earnings": round(total_earnings, 2),
        "withdrawn": round(total_withdrawn, 2),
        "available_balance": round(available_balance, 2),
        "total_bookings": count or 0
    }

@router.post("/withdraw")
async def request_withdrawal(request: WithdrawalRequest, user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can withdraw")
    
    result = await db.execute(select(Stylist).where(Stylist.user_id == user.user_id))
    stylist = result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    earnings_result = await db.execute(
        select(func.sum(Booking.total_price))
        .where(Booking.stylist_id == stylist.stylist_id, Booking.payment_status == "completed")
    )
    total = earnings_result.scalar() or 0
    total_earnings = total * 0.80
    
    withdrawn_result = await db.execute(
        select(func.sum(Withdrawal.amount))
        .where(Withdrawal.stylist_id == stylist.stylist_id, Withdrawal.status == "approved")
    )
    total_withdrawn = withdrawn_result.scalar() or 0
    
    available_balance = total_earnings - total_withdrawn
    
    if request.amount > available_balance:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    if request.amount < 10:
        raise HTTPException(status_code=400, detail="Minimum withdrawal is $10")
    
    new_withdrawal = Withdrawal(
        stylist_id=stylist.stylist_id,
        amount=request.amount,
        status="pending"
    )
    db.add(new_withdrawal)
    await db.commit()
    await db.refresh(new_withdrawal)
    
    from app.services.notifications import notification_service
    await notification_service.send_notification(
        user.user_id,
        "Withdrawal Requested",
        f"Your withdrawal of ${request.amount:.2f} is being processed. Funds typically arrive by Tuesday.",
        {"withdrawal_id": new_withdrawal.withdrawal_id, "type": "withdrawal_requested"}
    )
    
    return {
        "withdrawal_id": new_withdrawal.withdrawal_id,
        "message": "Withdrawal requested successfully. Funds will be processed by Tuesday."
    }

@router.post("/tax-info")
async def update_tax_info(tax_info: TaxInfoUpdate, user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can update tax info")
    
    result = await db.execute(select(Stylist).where(Stylist.user_id == user.user_id))
    stylist = result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    tax_result = await db.execute(
        select(TaxInfo).where(TaxInfo.stylist_id == stylist.stylist_id)
    )
    existing_tax_info = tax_result.scalar_one_or_none()
    
    if existing_tax_info:
        existing_tax_info.tax_id = tax_info.tax_id
        existing_tax_info.business_name = tax_info.business_name
        existing_tax_info.address = tax_info.address
        existing_tax_info.city = tax_info.city
        existing_tax_info.state = tax_info.state
        existing_tax_info.zip_code = tax_info.zip_code
    else:
        new_tax_info = TaxInfo(
            stylist_id=stylist.stylist_id,
            tax_id=tax_info.tax_id,
            business_name=tax_info.business_name,
            address=tax_info.address,
            city=tax_info.city,
            state=tax_info.state,
            zip_code=tax_info.zip_code
        )
        db.add(new_tax_info)
    
    await db.commit()
    
    return {"success": True, "message": "Tax information updated"}

@router.post("/verify-documents")
async def upload_verification_document(doc_type: str, user: User = Depends(get_current_user_full)):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can upload documents")
    
    return {
        "document_id": str(uuid.uuid4()),
        "message": "Document uploaded for review"
    }
