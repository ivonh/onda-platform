from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, or_
from typing import Optional
from app.database import get_db
from app.models.db_models import User, SupportTicket, Booking, Notification
from app.routes.auth import get_current_user_full
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tickets", tags=["tickets"])


async def verify_admin(current_user=Depends(get_current_user_full)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


class CreateTicketRequest(BaseModel):
    subject: str
    description: str
    category: Optional[str] = "general"
    booking_id: Optional[str] = None


class UpdateTicketRequest(BaseModel):
    status: Optional[str] = None
    admin_notes: Optional[str] = None
    assigned_admin_id: Optional[str] = None


@router.post("/")
async def create_ticket(
    request: CreateTicketRequest,
    current_user=Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    if request.booking_id:
        booking_result = await db.execute(
            select(Booking).where(Booking.booking_id == request.booking_id)
        )
        booking = booking_result.scalar_one_or_none()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

    ticket = SupportTicket(
        user_id=current_user.user_id,
        booking_id=request.booking_id,
        category=request.category,
        subject=request.subject,
        description=request.description
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    return {
        "ticket_id": ticket.ticket_id,
        "user_id": ticket.user_id,
        "booking_id": ticket.booking_id,
        "category": ticket.category,
        "status": ticket.status,
        "subject": ticket.subject,
        "description": ticket.description,
        "created_at": ticket.created_at.isoformat() if ticket.created_at else None
    }


@router.get("/my")
async def get_my_tickets(
    current_user=Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(SupportTicket)
        .where(SupportTicket.user_id == current_user.user_id)
        .order_by(SupportTicket.created_at.desc())
    )
    tickets = result.scalars().all()

    return [
        {
            "ticket_id": t.ticket_id,
            "booking_id": t.booking_id,
            "category": t.category,
            "status": t.status,
            "subject": t.subject,
            "description": t.description,
            "admin_notes": t.admin_notes,
            "resolved_at": t.resolved_at.isoformat() if t.resolved_at else None,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None
        }
        for t in tickets
    ]


@router.get("/")
async def get_all_tickets(
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    query = select(SupportTicket, User).join(User, SupportTicket.user_id == User.user_id)

    if status:
        query = query.where(SupportTicket.status == status)
    if category:
        query = query.where(SupportTicket.category == category)
    if search:
        query = query.where(
            or_(
                SupportTicket.subject.ilike(f"%{search}%"),
                SupportTicket.description.ilike(f"%{search}%")
            )
        )

    query = query.order_by(SupportTicket.created_at.desc())
    result = await db.execute(query)
    rows = result.all()

    return [
        {
            "ticket_id": ticket.ticket_id,
            "user_id": ticket.user_id,
            "user_name": user.name,
            "user_email": user.email,
            "booking_id": ticket.booking_id,
            "category": ticket.category,
            "status": ticket.status,
            "subject": ticket.subject,
            "description": ticket.description,
            "admin_notes": ticket.admin_notes,
            "assigned_admin_id": ticket.assigned_admin_id,
            "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
            "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
            "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None
        }
        for ticket, user in rows
    ]


@router.get("/{ticket_id}")
async def get_ticket(
    ticket_id: str,
    current_user=Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(SupportTicket).where(SupportTicket.ticket_id == ticket_id)
    )
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role != "admin" and ticket.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return {
        "ticket_id": ticket.ticket_id,
        "user_id": ticket.user_id,
        "booking_id": ticket.booking_id,
        "category": ticket.category,
        "status": ticket.status,
        "subject": ticket.subject,
        "description": ticket.description,
        "admin_notes": ticket.admin_notes,
        "assigned_admin_id": ticket.assigned_admin_id,
        "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
        "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
        "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None
    }


@router.put("/{ticket_id}")
async def update_ticket(
    ticket_id: str,
    request: UpdateTicketRequest,
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(SupportTicket).where(SupportTicket.ticket_id == ticket_id)
    )
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if request.status is not None:
        ticket.status = request.status
        if request.status == "resolved":
            ticket.resolved_at = datetime.now(timezone.utc)
    if request.admin_notes is not None:
        ticket.admin_notes = request.admin_notes
    if request.assigned_admin_id is not None:
        ticket.assigned_admin_id = request.assigned_admin_id

    await db.commit()
    await db.refresh(ticket)

    return {
        "ticket_id": ticket.ticket_id,
        "user_id": ticket.user_id,
        "booking_id": ticket.booking_id,
        "category": ticket.category,
        "status": ticket.status,
        "subject": ticket.subject,
        "description": ticket.description,
        "admin_notes": ticket.admin_notes,
        "assigned_admin_id": ticket.assigned_admin_id,
        "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
        "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
        "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None
    }
