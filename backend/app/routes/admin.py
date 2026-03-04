from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, or_
from typing import Optional
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.db_models import User, Stylist, Booking, Withdrawal, TaxInfo, StylistCredential, PortfolioPhoto, Notification
from app.routes.auth import get_current_user_full
from datetime import datetime, timezone, timedelta
import logging
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_EMAILS = [e.strip() for e in os.getenv("ADMIN_EMAILS", "admin@onda.com").split(",") if e.strip()]

class AdminUser(BaseModel):
    email: str

async def verify_admin(user: User = Depends(get_current_user_full)):
    if user.role != "admin" and user.email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin access only")
    return user

@router.get("/dashboard/stats")
async def get_dashboard_stats(admin: User = Depends(verify_admin), db: AsyncSession = Depends(get_db)):
    stylists_result = await db.execute(select(func.count()).select_from(Stylist))
    total_stylists = stylists_result.scalar() or 0
    
    approved_stylists_result = await db.execute(
        select(func.count()).select_from(Stylist).where(Stylist.approval_status == "approved")
    )
    approved_stylists = approved_stylists_result.scalar() or 0
    
    pending_stylists_result = await db.execute(
        select(func.count()).select_from(Stylist).where(Stylist.approval_status == "pending")
    )
    pending_stylists = pending_stylists_result.scalar() or 0
    
    clients_result = await db.execute(select(func.count()).select_from(User).where(User.role == "client"))
    total_clients = clients_result.scalar() or 0
    
    bookings_result = await db.execute(select(func.count()).select_from(Booking))
    total_bookings = bookings_result.scalar() or 0
    
    revenue_result = await db.execute(
        select(func.sum(Booking.total_price))
        .where(Booking.payment_status == "completed")
    )
    total_revenue = revenue_result.scalar() or 0.0
    
    platform_commission = total_revenue * 0.20
    stylist_earnings = total_revenue * 0.80
    
    pending_result = await db.execute(
        select(func.count()).select_from(Withdrawal).where(Withdrawal.status == "pending")
    )
    pending_withdrawals = pending_result.scalar() or 0
    
    pending_credentials_result = await db.execute(
        select(func.count()).select_from(StylistCredential).where(StylistCredential.verification_status == "pending")
    )
    pending_credentials = pending_credentials_result.scalar() or 0
    
    pending_photos_result = await db.execute(
        select(func.count()).select_from(PortfolioPhoto).where(PortfolioPhoto.moderation_status == "pending")
    )
    pending_photos = pending_photos_result.scalar() or 0
    
    return {
        "total_stylists": total_stylists,
        "approved_stylists": approved_stylists,
        "pending_stylists": pending_stylists,
        "total_clients": total_clients,
        "total_bookings": total_bookings,
        "total_revenue": round(total_revenue, 2),
        "platform_commission": round(platform_commission, 2),
        "stylist_earnings": round(stylist_earnings, 2),
        "pending_withdrawals": pending_withdrawals,
        "pending_credentials": pending_credentials,
        "pending_photos": pending_photos
    }

@router.get("/withdrawals/pending")
async def get_pending_withdrawals(admin: User = Depends(verify_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Withdrawal)
        .options(selectinload(Withdrawal.stylist).selectinload(Stylist.user))
        .where(Withdrawal.status == "pending")
        .order_by(Withdrawal.created_at.asc())
        .limit(100)
    )
    withdrawals = result.scalars().all()
    
    response = []
    for w in withdrawals:
        stylist_name = "Unknown"
        stylist_email = "Unknown"
        if w.stylist and w.stylist.user:
            stylist_name = w.stylist.user.name
            stylist_email = w.stylist.user.email
        
        response.append({
            "withdrawal_id": w.withdrawal_id,
            "stylist_id": w.stylist_id,
            "amount": w.amount,
            "status": w.status,
            "created_at": w.created_at.isoformat() if w.created_at else None,
            "stylist_name": stylist_name,
            "stylist_email": stylist_email
        })
    
    return response

@router.put("/withdrawals/{withdrawal_id}/approve")
async def approve_withdrawal(withdrawal_id: str, admin: User = Depends(verify_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Withdrawal).where(Withdrawal.withdrawal_id == withdrawal_id)
    )
    withdrawal = result.scalar_one_or_none()
    
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    
    withdrawal.status = "approved"
    withdrawal.approved_at = datetime.now(timezone.utc)
    withdrawal.approved_by = admin.user_id
    
    await db.commit()
    
    return {"success": True, "message": "Withdrawal approved"}

@router.get("/tax-info")
async def get_tax_information(admin: User = Depends(verify_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Stylist)
        .options(selectinload(Stylist.user))
    )
    stylists = result.scalars().all()
    
    tax_data = []
    for stylist in stylists:
        bookings_result = await db.execute(
            select(func.sum(Booking.total_price), func.count(Booking.id))
            .where(Booking.stylist_id == stylist.stylist_id, Booking.payment_status == "completed")
        )
        total, count = bookings_result.one()
        total_earnings = (total or 0) * 0.80
        
        tax_result = await db.execute(
            select(TaxInfo).where(TaxInfo.stylist_id == stylist.stylist_id)
        )
        tax_info = tax_result.scalar_one_or_none()
        
        tax_info_dict = {}
        if tax_info:
            tax_info_dict = {
                "tax_id": tax_info.tax_id,
                "business_name": tax_info.business_name,
                "address": tax_info.address,
                "city": tax_info.city,
                "state": tax_info.state,
                "zip_code": tax_info.zip_code
            }
        
        tax_data.append({
            "stylist_id": stylist.stylist_id,
            "name": stylist.user.name if stylist.user else "Unknown",
            "email": stylist.user.email if stylist.user else "Unknown",
            "total_bookings": count or 0,
            "total_earnings": round(total_earnings, 2),
            "tax_info": tax_info_dict,
            "has_tax_info": tax_info is not None
        })
    
    return tax_data

@router.get("/bookings/weekly")
async def get_weekly_bookings(admin: User = Depends(verify_admin), db: AsyncSession = Depends(get_db)):
    today = datetime.now(timezone.utc)
    week_start = today - timedelta(days=today.weekday())
    
    result = await db.execute(
        select(Booking)
        .where(
            Booking.created_at >= week_start,
            Booking.payment_status == "completed"
        )
    )
    bookings = result.scalars().all()
    
    return [
        {
            "booking_id": b.booking_id,
            "client_id": b.client_id,
            "stylist_id": b.stylist_id,
            "total_price": b.total_price,
            "created_at": b.created_at.isoformat() if b.created_at else None
        }
        for b in bookings
    ]


class StylistApprovalRequest(BaseModel):
    action: str
    notes: str = ""

class CredentialVerifyRequest(BaseModel):
    action: str
    notes: str = ""

class PhotoModerationRequest(BaseModel):
    action: str
    notes: str = ""


@router.get("/stylists/pending")
async def get_pending_stylists(admin: User = Depends(verify_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Stylist)
        .options(selectinload(Stylist.user), selectinload(Stylist.credentials), selectinload(Stylist.pricing))
        .where(Stylist.approval_status == "pending")
        .order_by(Stylist.created_at.desc())
    )
    stylists = result.scalars().all()
    
    response = []
    for stylist in stylists:
        credentials_list = []
        for c in (stylist.credentials or []):
            credentials_list.append({
                "credential_id": c.credential_id,
                "credential_type": c.credential_type,
                "credential_name": c.credential_name,
                "document_url": c.document_url,
                "verification_status": c.verification_status
            })
        
        response.append({
            "stylist_id": stylist.stylist_id,
            "user_id": stylist.user_id,
            "name": stylist.user.name if stylist.user else "Unknown",
            "email": stylist.user.email if stylist.user else "Unknown",
            "phone": stylist.user.phone if stylist.user else None,
            "bio": stylist.bio,
            "years_experience": stylist.years_experience,
            "skills": stylist.skills or [],
            "portfolio_images": stylist.portfolio_images or [],
            "service_address": stylist.service_address,
            "credentials": credentials_list,
            "created_at": stylist.created_at.isoformat() if stylist.created_at else None
        })
    
    return response


@router.put("/stylists/{stylist_id}/approval")
async def update_stylist_approval(
    stylist_id: str,
    request: StylistApprovalRequest,
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Stylist)
        .options(selectinload(Stylist.user))
        .where(Stylist.stylist_id == stylist_id)
    )
    stylist = result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist not found")
    
    if request.action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
    
    stylist.approval_status = "approved" if request.action == "approve" else "rejected"
    stylist.approval_notes = request.notes
    stylist.approved_at = datetime.now(timezone.utc)
    stylist.approved_by = admin.user_id
    
    notification = Notification(
        user_id=stylist.user_id,
        title="Profile Review Complete" if request.action == "approve" else "Profile Review Update",
        message=f"Your stylist profile has been {'approved! You can now receive bookings.' if request.action == 'approve' else 'reviewed. Please check the notes and update your profile: ' + request.notes}",
        data={"type": "profile_approval", "status": stylist.approval_status}
    )
    db.add(notification)
    
    await db.commit()
    
    return {
        "success": True,
        "message": f"Stylist {request.action}d successfully",
        "stylist_id": stylist_id,
        "new_status": stylist.approval_status
    }


@router.get("/credentials/pending")
async def get_pending_credentials(admin: User = Depends(verify_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(StylistCredential)
        .options(selectinload(StylistCredential.stylist).selectinload(Stylist.user))
        .where(StylistCredential.verification_status == "pending")
        .order_by(StylistCredential.created_at.desc())
    )
    credentials = result.scalars().all()
    
    return [
        {
            "credential_id": c.credential_id,
            "stylist_id": c.stylist_id,
            "stylist_name": c.stylist.user.name if c.stylist and c.stylist.user else "Unknown",
            "credential_type": c.credential_type,
            "credential_name": c.credential_name,
            "issuing_organization": c.issuing_organization,
            "issue_date": c.issue_date.isoformat() if c.issue_date else None,
            "expiry_date": c.expiry_date.isoformat() if c.expiry_date else None,
            "credential_number": c.credential_number,
            "document_url": c.document_url,
            "created_at": c.created_at.isoformat() if c.created_at else None
        }
        for c in credentials
    ]


@router.put("/credentials/{credential_id}/verify")
async def verify_credential(
    credential_id: str,
    request: CredentialVerifyRequest,
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(StylistCredential)
        .options(selectinload(StylistCredential.stylist).selectinload(Stylist.user))
        .where(StylistCredential.credential_id == credential_id)
    )
    credential = result.scalar_one_or_none()
    
    if not credential:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    if request.action not in ["verify", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'verify' or 'reject'")
    
    credential.verification_status = "verified" if request.action == "verify" else "rejected"
    credential.verified_at = datetime.now(timezone.utc)
    credential.verified_by = admin.user_id
    credential.verification_notes = request.notes
    
    if credential.stylist and credential.stylist.user:
        notification = Notification(
            user_id=credential.stylist.user_id,
            title="Credential Verified" if request.action == "verify" else "Credential Review",
            message=f"Your {credential.credential_name} has been {'verified and will be displayed on your profile.' if request.action == 'verify' else 'reviewed: ' + request.notes}",
            data={"type": "credential_verification", "credential_id": credential_id, "status": credential.verification_status}
        )
        db.add(notification)
    
    await db.commit()
    
    return {
        "success": True,
        "message": f"Credential {request.action}d successfully",
        "credential_id": credential_id,
        "new_status": credential.verification_status
    }


@router.get("/photos/pending")
async def get_pending_photos(admin: User = Depends(verify_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PortfolioPhoto)
        .where(PortfolioPhoto.moderation_status == "pending")
        .order_by(PortfolioPhoto.created_at.desc())
    )
    photos = result.scalars().all()
    
    stylist_ids = list(set(p.stylist_id for p in photos))
    stylists_result = await db.execute(
        select(Stylist)
        .options(selectinload(Stylist.user))
        .where(Stylist.stylist_id.in_(stylist_ids))
    )
    stylists_map = {s.stylist_id: s for s in stylists_result.scalars().all()}
    
    return [
        {
            "photo_id": p.photo_id,
            "stylist_id": p.stylist_id,
            "stylist_name": stylists_map.get(p.stylist_id).user.name if stylists_map.get(p.stylist_id) and stylists_map.get(p.stylist_id).user else "Unknown",
            "photo_url": p.photo_url,
            "photo_type": p.photo_type,
            "caption": p.caption,
            "created_at": p.created_at.isoformat() if p.created_at else None
        }
        for p in photos
    ]


@router.put("/photos/{photo_id}/moderate")
async def moderate_photo(
    photo_id: str,
    request: PhotoModerationRequest,
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PortfolioPhoto)
        .options(selectinload(PortfolioPhoto.stylist).selectinload(Stylist.user))
        .where(PortfolioPhoto.photo_id == photo_id)
    )
    photo = result.scalar_one_or_none()
    
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    if request.action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
    
    photo.moderation_status = "approved" if request.action == "approve" else "rejected"
    photo.moderated_at = datetime.now(timezone.utc)
    photo.moderated_by = admin.user_id
    photo.moderation_notes = request.notes
    
    if photo.stylist and photo.stylist.user:
        notification = Notification(
            user_id=photo.stylist.user.user_id,
            type="photo_moderation",
            title="Photo Review Complete" if request.action == "approve" else "Photo Review Update",
            message=f"Your portfolio photo has been {'approved and is now visible to clients.' if request.action == 'approve' else 'reviewed. Reason: ' + (request.notes or 'Photo does not meet requirements.')}",
            data={"type": "photo_moderation", "status": photo.moderation_status}
        )
        db.add(notification)
    
    await db.commit()
    
    return {
        "success": True,
        "message": f"Photo {request.action}d successfully",
        "photo_id": photo_id,
        "new_status": photo.moderation_status
    }


class AdminEmailRequest(BaseModel):
    to_email: str
    subject: str
    body: str
    template_id: str = "custom"

@router.post("/emails/send")
async def send_admin_email(
    request: AdminEmailRequest,
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    user_result = await db.execute(
        select(User).where(User.email == request.to_email)
    )
    recipient = user_result.scalar_one_or_none()
    
    if recipient:
        notification = Notification(
            user_id=recipient.user_id,
            type="admin_email",
            title=request.subject,
            message=request.body[:500],
            data={"type": "admin_email", "template_id": request.template_id, "full_message": request.body}
        )
        db.add(notification)
        await db.commit()
    
    logger.info(f"Admin email sent to {request.to_email}: {request.subject} (template: {request.template_id})")
    
    return {
        "success": True,
        "message": f"Email sent to {request.to_email}",
        "delivered_as_notification": recipient is not None
    }

@router.get("/users")
async def get_all_users(
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
    role: Optional[str] = None,
    search: Optional[str] = None
):
    query = select(User).order_by(User.created_at.desc())
    
    if role:
        query = query.where(User.role == role)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                User.email.ilike(search_term),
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term),
                User.name.ilike(search_term)
            )
        )
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    return [
        {
            "user_id": u.user_id,
            "email": u.email,
            "name": u.name,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "role": u.role,
            "phone": u.phone,
            "date_of_birth": str(u.date_of_birth) if u.date_of_birth else None,
            "created_at": u.created_at.isoformat() if u.created_at else None
        }
        for u in users
    ]
