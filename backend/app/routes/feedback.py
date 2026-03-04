from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.db_models import User, Stylist, Booking, BookingFeedback, BookingCompletion, Notification, CouponCode, Rating
from app.routes.auth import get_current_user_full
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import random
import string

router = APIRouter(prefix="/feedback", tags=["feedback"])


class CompleteBookingRequest(BaseModel):
    booking_id: str
    completion_notes: Optional[str] = None
    before_photo_url: Optional[str] = None
    after_photo_url: Optional[str] = None


class SubmitFeedbackRequest(BaseModel):
    booking_id: str
    before_after_rating: Optional[int] = None
    stylist_behavior_rating: Optional[int] = None
    would_book_again: Optional[bool] = None
    why_chose_onda: Optional[str] = None
    will_post_social: Optional[bool] = None
    social_platform: Optional[str] = None
    before_photo_url: Optional[str] = None
    after_photo_url: Optional[str] = None
    photo_consent: Optional[bool] = False
    overall_rating: Optional[int] = None
    service_quality: Optional[int] = None
    punctuality: Optional[int] = None
    communication: Optional[int] = None
    would_recommend: Optional[bool] = None
    feedback_text: Optional[str] = None
    what_they_loved: Optional[str] = None
    improvement_suggestions: Optional[str] = None


class DeclineFeedbackRequest(BaseModel):
    booking_id: str


def _generate_coupon_code(length=6):
    chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    return f"ONDA-{chars}-15"

async def _generate_unique_coupon_code(db):
    for _ in range(10):
        code = _generate_coupon_code()
        existing = await db.execute(select(CouponCode).where(CouponCode.code == code))
        if not existing.scalar_one_or_none():
            return code
    return _generate_coupon_code(length=10)


@router.post("/complete-booking")
async def complete_booking(
    request: CompleteBookingRequest,
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can mark bookings as complete")
    
    result = await db.execute(select(Stylist).where(Stylist.user_id == user.user_id))
    stylist = result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    booking_result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.client))
        .where(
            and_(
                Booking.booking_id == request.booking_id,
                Booking.stylist_id == stylist.stylist_id
            )
        )
    )
    booking = booking_result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status == "completed":
        raise HTTPException(status_code=400, detail="Booking is already completed")
    
    if booking.status not in ["confirmed", "in_progress"]:
        raise HTTPException(status_code=400, detail=f"Cannot complete booking with status '{booking.status}'. Only confirmed or in-progress bookings can be completed.")
    
    existing_completion = await db.execute(
        select(BookingCompletion).where(BookingCompletion.booking_id == request.booking_id)
    )
    if existing_completion.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Booking completion already recorded")
    
    existing_feedback = await db.execute(
        select(BookingFeedback).where(BookingFeedback.booking_id == request.booking_id)
    )
    if existing_feedback.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Feedback already exists for this booking")
    
    booking.status = "completed"
    
    completion = BookingCompletion(
        booking_id=request.booking_id,
        stylist_id=stylist.stylist_id,
        completion_notes=request.completion_notes,
        before_photo_url=request.before_photo_url,
        after_photo_url=request.after_photo_url,
        client_notified=True,
        feedback_requested=True
    )
    
    db.add(completion)
    
    feedback_record = BookingFeedback(
        booking_id=request.booking_id,
        client_id=booking.client_id,
        stylist_id=stylist.stylist_id,
        survey_prompted_at=datetime.now(timezone.utc)
    )
    db.add(feedback_record)
    
    notification = Notification(
        user_id=booking.client_id,
        title="Your appointment is complete!",
        message=f"Your appointment with {user.name} has been marked as complete. We'd love to hear about your experience!",
        data={
            "type": "booking_complete",
            "booking_id": request.booking_id,
            "stylist_name": user.name,
            "services": booking.services
        }
    )
    db.add(notification)
    
    await db.commit()
    await db.refresh(completion)
    
    return {
        "success": True,
        "message": "Booking marked as complete. Client will be prompted for feedback.",
        "completion_id": completion.completion_id,
        "client_name": booking.client.name if booking.client else "Client"
    }


@router.get("/pending")
async def get_pending_feedback(
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(BookingFeedback)
        .options(
            selectinload(BookingFeedback.booking).selectinload(Booking.stylist).selectinload(Stylist.user),
            selectinload(BookingFeedback.booking)
        )
        .where(
            and_(
                BookingFeedback.client_id == user.user_id,
                BookingFeedback.survey_completed == False,
                BookingFeedback.survey_declined == False
            )
        )
        .order_by(BookingFeedback.survey_prompted_at.desc())
    )
    pending = result.scalars().all()
    
    return {
        "pending_feedback": [
            {
                "feedback_id": f.feedback_id,
                "booking_id": f.booking_id,
                "stylist_name": f.booking.stylist.user.name if f.booking and f.booking.stylist and f.booking.stylist.user else "Stylist",
                "services": f.booking.services if f.booking else [],
                "completed_at": f.survey_prompted_at.isoformat() if f.survey_prompted_at else None
            }
            for f in pending
        ],
        "count": len(pending)
    }


@router.post("/submit")
async def submit_feedback(
    request: SubmitFeedbackRequest,
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(BookingFeedback).where(
            and_(
                BookingFeedback.booking_id == request.booking_id,
                BookingFeedback.client_id == user.user_id
            )
        )
    )
    feedback = result.scalar_one_or_none()
    
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback record not found")
    
    if feedback.survey_completed:
        raise HTTPException(status_code=400, detail="Feedback already submitted")
    
    feedback.before_after_rating = request.before_after_rating
    feedback.stylist_behavior_rating = request.stylist_behavior_rating
    feedback.would_book_again = request.would_book_again
    feedback.why_chose_onda = request.why_chose_onda
    feedback.will_post_social = request.will_post_social
    feedback.social_platform = request.social_platform

    computed_overall = request.overall_rating
    if not computed_overall and request.before_after_rating and request.stylist_behavior_rating:
        computed_overall = round((request.before_after_rating + request.stylist_behavior_rating) / 2)

    feedback.overall_rating = computed_overall
    feedback.service_quality = request.service_quality
    feedback.punctuality = request.punctuality
    feedback.communication = request.communication
    feedback.would_recommend = request.would_recommend
    feedback.feedback_text = request.feedback_text
    feedback.what_they_loved = request.what_they_loved
    feedback.improvement_suggestions = request.improvement_suggestions
    feedback.before_photo_url = request.before_photo_url
    feedback.after_photo_url = request.after_photo_url
    feedback.photo_consent = request.photo_consent or False
    feedback.survey_completed = True
    feedback.survey_completed_at = datetime.now(timezone.utc)
    
    coupon_code_str = None
    if request.photo_consent:
        booking_result = await db.execute(
            select(Booking)
            .options(selectinload(Booking.stylist).selectinload(Stylist.user))
            .where(Booking.booking_id == request.booking_id)
        )
        booking = booking_result.scalar_one_or_none()

        coupon_code_str = await _generate_unique_coupon_code(db)
        stylist_name = None
        service_desc = None
        stylist_id_val = feedback.stylist_id

        if booking and booking.stylist:
            if booking.stylist.user:
                stylist_name = booking.stylist.user.name
            service_desc = ", ".join(booking.services) if booking.services else None

        coupon = CouponCode(
            code=coupon_code_str,
            discount_percent=15.0,
            generated_from_feedback_id=feedback.feedback_id,
            stylist_id=stylist_id_val,
            generated_for_user_id=user.user_id,
            before_photo_url=request.before_photo_url,
            after_photo_url=request.after_photo_url,
            stylist_name=stylist_name,
            service_description=service_desc,
            expires_at=datetime.now(timezone.utc) + timedelta(days=30),
        )
        db.add(coupon)
        feedback.coupon_code_generated = coupon_code_str

    if computed_overall:
        stylist_result = await db.execute(select(Stylist).where(Stylist.stylist_id == feedback.stylist_id))
        stylist = stylist_result.scalar_one_or_none()
        if stylist:
            avg_result = await db.execute(
                select(func.avg(Rating.rating), func.count(Rating.id))
                .where(Rating.stylist_id == feedback.stylist_id)
            )
            avg_rating, total_ratings = avg_result.one()
            
            completed_feedbacks = await db.execute(
                select(func.avg(BookingFeedback.overall_rating), func.count(BookingFeedback.id))
                .where(
                    and_(
                        BookingFeedback.stylist_id == feedback.stylist_id,
                        BookingFeedback.survey_completed == True,
                        BookingFeedback.overall_rating.isnot(None)
                    )
                )
            )
            fb_avg, fb_count = completed_feedbacks.one()

            r_avg = float(avg_rating) if avg_rating else 0
            r_count = int(total_ratings) if total_ratings else 0
            f_avg = float(fb_avg) if fb_avg else 0
            f_count = int(fb_count) if fb_count else 0
            combined_count = r_count + f_count

            if combined_count > 0:
                combined_avg = (r_avg * r_count + f_avg * f_count) / combined_count
                stylist.average_rating = round(combined_avg, 2)
                stylist.total_ratings = combined_count

    await db.commit()
    
    response = {
        "success": True,
        "message": "Thank you for your feedback! Your input helps stylists improve their service."
    }
    if coupon_code_str:
        response["coupon_code"] = coupon_code_str
        response["discount_percent"] = 15
        response["message"] = "Thank you for your feedback! Here's a 15% discount coupon for sharing your before & after photos."
    
    return response


@router.post("/decline")
async def decline_feedback(
    request: DeclineFeedbackRequest,
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(BookingFeedback).where(
            and_(
                BookingFeedback.booking_id == request.booking_id,
                BookingFeedback.client_id == user.user_id
            )
        )
    )
    feedback = result.scalar_one_or_none()
    
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback record not found")
    
    feedback.survey_declined = True
    await db.commit()
    
    return {
        "success": True,
        "message": "No problem! Thank you for using Onda."
    }


@router.get("/before-after/{stylist_id}")
async def get_before_after_photos(
    stylist_id: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(BookingFeedback)
        .options(selectinload(BookingFeedback.booking))
        .where(
            and_(
                BookingFeedback.stylist_id == stylist_id,
                BookingFeedback.photo_consent == True,
                BookingFeedback.survey_completed == True,
                BookingFeedback.before_photo_url.isnot(None),
                BookingFeedback.after_photo_url.isnot(None)
            )
        )
        .order_by(BookingFeedback.survey_completed_at.desc())
    )
    feedbacks = result.scalars().all()
    
    return {
        "before_after_photos": [
            {
                "feedback_id": f.feedback_id,
                "before_photo_url": f.before_photo_url,
                "after_photo_url": f.after_photo_url,
                "overall_rating": f.overall_rating,
                "before_after_rating": f.before_after_rating,
                "services": f.booking.services if f.booking else [],
                "completed_at": f.survey_completed_at.isoformat() if f.survey_completed_at else None
            }
            for f in feedbacks
        ],
        "count": len(feedbacks)
    }


@router.get("/stylist-summary")
async def get_stylist_feedback_summary(
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can view feedback summary")
    
    result = await db.execute(select(Stylist).where(Stylist.user_id == user.user_id))
    stylist = result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    feedback_result = await db.execute(
        select(BookingFeedback).where(
            and_(
                BookingFeedback.stylist_id == stylist.stylist_id,
                BookingFeedback.survey_completed == True
            )
        )
    )
    feedbacks = feedback_result.scalars().all()
    
    if not feedbacks:
        return {
            "total_reviews": 0,
            "average_rating": None,
            "recommendation_rate": None,
            "recent_feedback": []
        }
    
    ratings = [f.overall_rating for f in feedbacks if f.overall_rating]
    recommends = [f.would_recommend for f in feedbacks if f.would_recommend is not None]
    
    return {
        "total_reviews": len(feedbacks),
        "average_rating": round(sum(ratings) / len(ratings), 1) if ratings else None,
        "recommendation_rate": round(sum(1 for r in recommends if r) / len(recommends) * 100, 1) if recommends else None,
        "recent_feedback": [
            {
                "rating": f.overall_rating,
                "feedback_text": f.feedback_text,
                "what_they_loved": f.what_they_loved,
                "completed_at": f.survey_completed_at.isoformat() if f.survey_completed_at else None
            }
            for f in sorted(feedbacks, key=lambda x: x.survey_completed_at or datetime.min, reverse=True)[:5]
        ]
    }
