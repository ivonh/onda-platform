from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.db_models import User
from app.routes.auth import get_current_user_full
from datetime import datetime, timezone
from typing import Optional
from enum import Enum

router = APIRouter(prefix="/concierge", tags=["concierge"])

class FeedbackType(str, Enum):
    COMPLAINT = "complaint"
    SUGGESTION = "suggestion"
    COMPLIMENT = "compliment"
    BUG_REPORT = "bug_report"
    OTHER = "other"

class FeedbackStatus(str, Enum):
    OPEN = "open"
    IN_REVIEW = "in_review"
    RESOLVED = "resolved"
    CLOSED = "closed"

class FeedbackCreate(BaseModel):
    type: FeedbackType
    subject: str
    message: str
    booking_id: Optional[str] = None
    stylist_id: Optional[str] = None

class FeedbackResponse(BaseModel):
    response_message: str

feedback_storage = []

@router.post("/feedback")
async def submit_feedback(request: FeedbackCreate, user: User = Depends(get_current_user_full)):
    import uuid
    feedback_id = str(uuid.uuid4())
    
    feedback_doc = {
        "feedback_id": feedback_id,
        "user_id": user.user_id,
        "user_name": user.name,
        "user_email": user.email,
        "type": request.type,
        "subject": request.subject,
        "message": request.message,
        "booking_id": request.booking_id,
        "stylist_id": request.stylist_id,
        "status": FeedbackStatus.OPEN,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    feedback_storage.append(feedback_doc)
    
    return {
        "feedback_id": feedback_id,
        "message": "Thank you for your feedback. Our concierge team will review it shortly.",
        "reference_number": feedback_id[:8].upper()
    }

@router.get("/my-feedback")
async def get_my_feedback(user: User = Depends(get_current_user_full)):
    return [f for f in feedback_storage if f["user_id"] == user.user_id]

@router.get("/feedback/{feedback_id}")
async def get_feedback_detail(feedback_id: str, user: User = Depends(get_current_user_full)):
    feedback = next((f for f in feedback_storage if f["feedback_id"] == feedback_id and f["user_id"] == user.user_id), None)
    
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    return {
        "feedback": feedback,
        "responses": []
    }

@router.post("/feedback/{feedback_id}/respond")
async def respond_to_feedback(feedback_id: str, request: FeedbackResponse, user: User = Depends(get_current_user_full)):
    feedback = next((f for f in feedback_storage if f["feedback_id"] == feedback_id), None)
    
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    return {"success": True, "message": "Response sent"}
