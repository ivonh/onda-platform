from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.db_models import User, Stylist, StylistCredential, PortfolioPhoto
from app.routes.auth import get_current_user_full
from datetime import datetime, timezone
from typing import Optional, List

router = APIRouter(prefix="/credentials", tags=["credentials"])


class CredentialCreate(BaseModel):
    credential_type: str
    credential_name: str
    issuing_organization: Optional[str] = None
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    credential_number: Optional[str] = None
    document_url: str


class PortfolioPhotoCreate(BaseModel):
    photo_url: str
    photo_type: str
    caption: Optional[str] = None


VALID_PHOTO_TYPES = ["full_length_glamour", "head_and_shoulders", "work_sample", "before_after"]

CREDENTIAL_TYPES = [
    "beauty_therapy_certificate",
    "hairdressing_certificate",
    "makeup_artistry_certificate",
    "nail_technician_certificate",
    "skin_care_certificate",
    "massage_therapy_certificate",
    "cosmetic_tattoo_certificate",
    "first_aid_certificate",
    "business_license",
    "insurance_certificate",
    "other"
]


@router.get("/my")
async def get_my_credentials(
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can access credentials")
    
    stylist_result = await db.execute(
        select(Stylist).where(Stylist.user_id == user.user_id)
    )
    stylist = stylist_result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    result = await db.execute(
        select(StylistCredential)
        .where(StylistCredential.stylist_id == stylist.stylist_id)
        .order_by(StylistCredential.created_at.desc())
    )
    credentials = result.scalars().all()
    
    return [
        {
            "credential_id": c.credential_id,
            "credential_type": c.credential_type,
            "credential_name": c.credential_name,
            "issuing_organization": c.issuing_organization,
            "issue_date": c.issue_date.isoformat() if c.issue_date else None,
            "expiry_date": c.expiry_date.isoformat() if c.expiry_date else None,
            "credential_number": c.credential_number,
            "document_url": c.document_url,
            "verification_status": c.verification_status,
            "verified_at": c.verified_at.isoformat() if c.verified_at else None,
            "verification_notes": c.verification_notes,
            "created_at": c.created_at.isoformat() if c.created_at else None
        }
        for c in credentials
    ]


@router.post("/upload")
async def upload_credential(
    request: CredentialCreate,
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can upload credentials")
    
    stylist_result = await db.execute(
        select(Stylist).where(Stylist.user_id == user.user_id)
    )
    stylist = stylist_result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    if request.credential_type not in CREDENTIAL_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid credential type. Valid types: {', '.join(CREDENTIAL_TYPES)}")
    
    credential = StylistCredential(
        stylist_id=stylist.stylist_id,
        credential_type=request.credential_type,
        credential_name=request.credential_name,
        issuing_organization=request.issuing_organization,
        issue_date=request.issue_date,
        expiry_date=request.expiry_date,
        credential_number=request.credential_number,
        document_url=request.document_url
    )
    
    db.add(credential)
    await db.commit()
    await db.refresh(credential)
    
    return {
        "success": True,
        "message": "Credential uploaded successfully. It will be reviewed by our team.",
        "credential_id": credential.credential_id,
        "verification_status": credential.verification_status
    }


@router.delete("/{credential_id}")
async def delete_credential(
    credential_id: str,
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can delete credentials")
    
    stylist_result = await db.execute(
        select(Stylist).where(Stylist.user_id == user.user_id)
    )
    stylist = stylist_result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    result = await db.execute(
        select(StylistCredential)
        .where(StylistCredential.credential_id == credential_id)
        .where(StylistCredential.stylist_id == stylist.stylist_id)
    )
    credential = result.scalar_one_or_none()
    
    if not credential:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    await db.delete(credential)
    await db.commit()
    
    return {"success": True, "message": "Credential deleted successfully"}


@router.get("/types")
async def get_credential_types():
    return {
        "credential_types": [
            {"value": "beauty_therapy_certificate", "label": "Beauty Therapy Certificate"},
            {"value": "hairdressing_certificate", "label": "Hairdressing Certificate"},
            {"value": "makeup_artistry_certificate", "label": "Makeup Artistry Certificate"},
            {"value": "nail_technician_certificate", "label": "Nail Technician Certificate"},
            {"value": "skin_care_certificate", "label": "Skin Care Certificate"},
            {"value": "massage_therapy_certificate", "label": "Massage Therapy Certificate"},
            {"value": "cosmetic_tattoo_certificate", "label": "Cosmetic Tattoo Certificate"},
            {"value": "first_aid_certificate", "label": "First Aid Certificate"},
            {"value": "business_license", "label": "Business License / ABN"},
            {"value": "insurance_certificate", "label": "Professional Insurance Certificate"},
            {"value": "other", "label": "Other Professional Qualification"}
        ],
        "photo_types": [
            {"value": "full_length_glamour", "label": "Full Length Glamour Shot"},
            {"value": "head_and_shoulders", "label": "Professional Head & Shoulders"},
            {"value": "work_sample", "label": "Work Sample (Client Result)"},
            {"value": "before_after", "label": "Before & After"}
        ]
    }


@router.get("/portfolio")
async def get_my_portfolio(
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can access portfolio")
    
    stylist_result = await db.execute(
        select(Stylist).where(Stylist.user_id == user.user_id)
    )
    stylist = stylist_result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    result = await db.execute(
        select(PortfolioPhoto)
        .where(PortfolioPhoto.stylist_id == stylist.stylist_id)
        .order_by(PortfolioPhoto.display_order.asc(), PortfolioPhoto.created_at.desc())
    )
    photos = result.scalars().all()
    
    return [
        {
            "photo_id": p.photo_id,
            "photo_url": p.photo_url,
            "photo_type": p.photo_type,
            "caption": p.caption,
            "display_order": p.display_order,
            "moderation_status": p.moderation_status,
            "moderation_notes": p.moderation_notes,
            "created_at": p.created_at.isoformat() if p.created_at else None
        }
        for p in photos
    ]


@router.post("/portfolio")
async def upload_portfolio_photo(
    request: PortfolioPhotoCreate,
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can upload photos")
    
    stylist_result = await db.execute(
        select(Stylist).where(Stylist.user_id == user.user_id)
    )
    stylist = stylist_result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    if request.photo_type not in VALID_PHOTO_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid photo type. Must be one of: {', '.join(VALID_PHOTO_TYPES)}. We only accept professional full-length glamour shots or head & shoulders photos."
        )
    
    count_result = await db.execute(
        select(PortfolioPhoto)
        .where(PortfolioPhoto.stylist_id == stylist.stylist_id)
    )
    existing_count = len(count_result.scalars().all())
    
    photo = PortfolioPhoto(
        stylist_id=stylist.stylist_id,
        photo_url=request.photo_url,
        photo_type=request.photo_type,
        caption=request.caption,
        display_order=existing_count
    )
    
    db.add(photo)
    await db.commit()
    await db.refresh(photo)
    
    return {
        "success": True,
        "message": "Photo uploaded successfully. It will be reviewed before appearing on your profile.",
        "photo_id": photo.photo_id,
        "moderation_status": photo.moderation_status
    }


@router.delete("/portfolio/{photo_id}")
async def delete_portfolio_photo(
    photo_id: str,
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can delete photos")
    
    stylist_result = await db.execute(
        select(Stylist).where(Stylist.user_id == user.user_id)
    )
    stylist = stylist_result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    result = await db.execute(
        select(PortfolioPhoto)
        .where(PortfolioPhoto.photo_id == photo_id)
        .where(PortfolioPhoto.stylist_id == stylist.stylist_id)
    )
    photo = result.scalar_one_or_none()
    
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    await db.delete(photo)
    await db.commit()
    
    return {"success": True, "message": "Photo deleted successfully"}


@router.get("/approval-status")
async def get_approval_status(
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can check approval status")
    
    stylist_result = await db.execute(
        select(Stylist)
        .options(selectinload(Stylist.credentials))
        .where(Stylist.user_id == user.user_id)
    )
    stylist = stylist_result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    verified_credentials = [c for c in (stylist.credentials or []) if c.verification_status == "verified"]
    pending_credentials = [c for c in (stylist.credentials or []) if c.verification_status == "pending"]
    
    return {
        "approval_status": stylist.approval_status,
        "approval_notes": stylist.approval_notes,
        "approved_at": stylist.approved_at.isoformat() if stylist.approved_at else None,
        "total_credentials": len(stylist.credentials or []),
        "verified_credentials": len(verified_credentials),
        "pending_credentials": len(pending_credentials),
        "is_visible_to_clients": stylist.approval_status == "approved"
    }
