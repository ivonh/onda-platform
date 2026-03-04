from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def check_and_send_reminders():
    from app.database import AsyncSessionLocal
    from app.models.db_models import Booking, BookingReminder, User, Stylist
    from app.services.email_service import email_service
    
    try:
        async with AsyncSessionLocal() as db:
            now = datetime.now(timezone.utc)
            reminder_window = now + timedelta(hours=25)
            
            reminders = await db.execute(
                select(BookingReminder)
                .where(and_(
                    BookingReminder.is_sent == False,
                    BookingReminder.scheduled_at <= now
                ))
            )
            pending_reminders = reminders.scalars().all()
            
            for reminder in pending_reminders:
                booking_result = await db.execute(
                    select(Booking).where(Booking.booking_id == reminder.booking_id)
                )
                booking = booking_result.scalar_one_or_none()
                
                if not booking or booking.status in ['cancelled', 'completed']:
                    reminder.is_sent = True
                    continue
                
                client_result = await db.execute(
                    select(User).where(User.user_id == booking.client_id)
                )
                client = client_result.scalar_one_or_none()
                
                stylist_result = await db.execute(
                    select(Stylist).where(Stylist.stylist_id == booking.stylist_id)
                )
                stylist = stylist_result.scalar_one_or_none()
                stylist_user = None
                if stylist:
                    stylist_user_result = await db.execute(
                        select(User).where(User.user_id == stylist.user_id)
                    )
                    stylist_user = stylist_user_result.scalar_one_or_none()
                
                if client and stylist_user:
                    hours_until = int((booking.scheduled_datetime - now).total_seconds() / 3600)
                    
                    booking_data = {
                        'client_name': client.name,
                        'client_email': client.email,
                        'stylist_name': stylist_user.name,
                        'scheduled_datetime': booking.scheduled_datetime,
                        'services': booking.services,
                        'location': booking.client_address or booking.meeting_location_address or 'Check app for details'
                    }
                    
                    success = await email_service.send_booking_reminder(booking_data, hours_until)
                    
                    if success:
                        reminder.is_sent = True
                        reminder.sent_at = now
                        logger.info(f"Sent reminder for booking {booking.booking_id}")
            
            await db.commit()
            
    except Exception as e:
        logger.error(f"Error in reminder scheduler: {e}")

def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(
            check_and_send_reminders,
            IntervalTrigger(minutes=5),
            id='reminder_checker',
            replace_existing=True
        )
        scheduler.start()
        logger.info("Reminder scheduler started")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Reminder scheduler stopped")
