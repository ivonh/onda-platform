from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract
from app.database import get_db
from app.models.db_models import User, Stylist, Booking, Rating
from app.routes.auth import get_current_user_full
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from collections import defaultdict

router = APIRouter(prefix="/analytics", tags=["analytics"])

class EarningsSummary(BaseModel):
    total_earnings: float
    period_earnings: float
    completed_bookings: int
    average_booking_value: float
    growth_percent: Optional[float]

class ServicePopularity(BaseModel):
    service: str
    count: int
    revenue: float
    percent_of_total: float

class TimeSlotAnalytics(BaseModel):
    hour: int
    bookings: int
    revenue: float

class ClientRetention(BaseModel):
    total_clients: int
    repeat_clients: int
    retention_rate: float
    average_bookings_per_client: float

class DashboardResponse(BaseModel):
    earnings: EarningsSummary
    popular_services: List[ServicePopularity]
    busy_hours: List[TimeSlotAnalytics]
    client_retention: ClientRetention
    recent_ratings: List[dict]
    period_label: str

@router.get("/dashboard", response_model=DashboardResponse)
async def get_stylist_dashboard(
    period: str = Query("month", enum=["week", "month", "quarter", "year"]),
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can access analytics")
    
    stylist_result = await db.execute(
        select(Stylist).where(Stylist.user_id == user.user_id)
    )
    stylist = stylist_result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    now = datetime.now(timezone.utc)
    period_days = {"week": 7, "month": 30, "quarter": 90, "year": 365}
    days = period_days.get(period, 30)
    period_start = now - timedelta(days=days)
    previous_period_start = period_start - timedelta(days=days)
    
    current_bookings_result = await db.execute(
        select(Booking)
        .where(and_(
            Booking.stylist_id == stylist.stylist_id,
            Booking.status == "completed",
            Booking.scheduled_datetime >= period_start
        ))
    )
    current_bookings = current_bookings_result.scalars().all()
    
    prev_bookings_result = await db.execute(
        select(Booking)
        .where(and_(
            Booking.stylist_id == stylist.stylist_id,
            Booking.status == "completed",
            Booking.scheduled_datetime >= previous_period_start,
            Booking.scheduled_datetime < period_start
        ))
    )
    prev_bookings = prev_bookings_result.scalars().all()
    
    all_completed_result = await db.execute(
        select(Booking)
        .where(and_(
            Booking.stylist_id == stylist.stylist_id,
            Booking.status == "completed"
        ))
    )
    all_completed = all_completed_result.scalars().all()
    
    period_earnings = sum(b.total_price for b in current_bookings)
    prev_period_earnings = sum(b.total_price for b in prev_bookings)
    total_earnings = sum(b.total_price for b in all_completed)
    
    growth_percent = None
    if prev_period_earnings > 0:
        growth_percent = ((period_earnings - prev_period_earnings) / prev_period_earnings) * 100
    
    avg_booking = period_earnings / len(current_bookings) if current_bookings else 0
    
    earnings = EarningsSummary(
        total_earnings=total_earnings,
        period_earnings=period_earnings,
        completed_bookings=len(current_bookings),
        average_booking_value=avg_booking,
        growth_percent=growth_percent
    )
    
    service_counts = defaultdict(lambda: {"count": 0, "revenue": 0.0})
    for booking in current_bookings:
        per_service_value = booking.service_price / len(booking.services) if booking.services else 0
        for service in booking.services:
            service_counts[service]["count"] += 1
            service_counts[service]["revenue"] += per_service_value
    
    total_service_revenue = sum(s["revenue"] for s in service_counts.values())
    popular_services = [
        ServicePopularity(
            service=service,
            count=data["count"],
            revenue=data["revenue"],
            percent_of_total=(data["revenue"] / total_service_revenue * 100) if total_service_revenue > 0 else 0
        )
        for service, data in sorted(service_counts.items(), key=lambda x: x[1]["count"], reverse=True)[:5]
    ]
    
    hour_stats = defaultdict(lambda: {"bookings": 0, "revenue": 0.0})
    for booking in current_bookings:
        hour = booking.scheduled_datetime.hour
        hour_stats[hour]["bookings"] += 1
        hour_stats[hour]["revenue"] += booking.total_price
    
    busy_hours = [
        TimeSlotAnalytics(hour=hour, bookings=data["bookings"], revenue=data["revenue"])
        for hour, data in sorted(hour_stats.items(), key=lambda x: x[1]["bookings"], reverse=True)[:8]
    ]
    
    client_ids = set()
    client_booking_counts = defaultdict(int)
    for booking in all_completed:
        client_ids.add(booking.client_id)
        client_booking_counts[booking.client_id] += 1
    
    repeat_clients = sum(1 for count in client_booking_counts.values() if count > 1)
    total_clients = len(client_ids)
    retention_rate = (repeat_clients / total_clients * 100) if total_clients > 0 else 0
    avg_bookings_per_client = len(all_completed) / total_clients if total_clients > 0 else 0
    
    client_retention = ClientRetention(
        total_clients=total_clients,
        repeat_clients=repeat_clients,
        retention_rate=retention_rate,
        average_bookings_per_client=avg_bookings_per_client
    )
    
    ratings_result = await db.execute(
        select(Rating)
        .where(Rating.stylist_id == stylist.stylist_id)
        .order_by(Rating.created_at.desc())
        .limit(5)
    )
    ratings = ratings_result.scalars().all()
    
    recent_ratings = []
    for r in ratings:
        user_result = await db.execute(select(User).where(User.user_id == r.user_id))
        rating_user = user_result.scalar_one_or_none()
        recent_ratings.append({
            "rating": r.rating,
            "feedback": r.feedback,
            "client_name": rating_user.name if rating_user else "Anonymous",
            "created_at": r.created_at.isoformat()
        })
    
    period_labels = {"week": "This Week", "month": "This Month", "quarter": "This Quarter", "year": "This Year"}
    
    return DashboardResponse(
        earnings=earnings,
        popular_services=popular_services,
        busy_hours=busy_hours,
        client_retention=client_retention,
        recent_ratings=recent_ratings,
        period_label=period_labels.get(period, "This Month")
    )

@router.get("/earnings-chart")
async def get_earnings_chart(
    period: str = Query("month", enum=["week", "month", "quarter", "year"]),
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "stylist":
        raise HTTPException(status_code=403, detail="Only stylists can access analytics")
    
    stylist_result = await db.execute(
        select(Stylist).where(Stylist.user_id == user.user_id)
    )
    stylist = stylist_result.scalar_one_or_none()
    
    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist profile not found")
    
    now = datetime.now(timezone.utc)
    period_days = {"week": 7, "month": 30, "quarter": 90, "year": 365}
    days = period_days.get(period, 30)
    period_start = now - timedelta(days=days)
    
    bookings_result = await db.execute(
        select(Booking)
        .where(and_(
            Booking.stylist_id == stylist.stylist_id,
            Booking.status == "completed",
            Booking.scheduled_datetime >= period_start
        ))
        .order_by(Booking.scheduled_datetime)
    )
    bookings = bookings_result.scalars().all()
    
    daily_earnings = defaultdict(float)
    for booking in bookings:
        date_key = booking.scheduled_datetime.strftime("%Y-%m-%d")
        daily_earnings[date_key] += booking.total_price
    
    chart_data = [
        {"date": date, "earnings": amount}
        for date, amount in sorted(daily_earnings.items())
    ]
    
    return {"chart_data": chart_data, "period": period}
