import os
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.db_models import Notification
from app.database import AsyncSessionLocal
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        self.firebase_enabled = bool(os.getenv("FIREBASE_PROJECT_ID"))
        if self.firebase_enabled:
            try:
                import firebase_admin
                from firebase_admin import credentials, messaging as fcm
                
                cred = credentials.Certificate({
                    "type": "service_account",
                    "project_id": os.getenv("FIREBASE_PROJECT_ID"),
                    "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
                    "client_email": os.getenv("FIREBASE_CLIENT_EMAIL")
                })
                
                if not firebase_admin._apps:
                    firebase_admin.initialize_app(cred)
                
                self.fcm = fcm
                logger.info("Firebase initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Firebase: {str(e)}")
                self.firebase_enabled = False
        else:
            logger.info("Firebase not configured - notifications will be stored only")
    
    async def send_notification(self, user_id: str, title: str, body: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        async with AsyncSessionLocal() as db:
            new_notification = Notification(
                user_id=user_id,
                title=title,
                message=body,
                data=data or {}
            )
            
            db.add(new_notification)
            await db.commit()
            await db.refresh(new_notification)
            
            created_at = getattr(new_notification, 'created_at', None)
            return {
                "notification_id": new_notification.notification_id,
                "user_id": user_id,
                "title": title,
                "body": body,
                "data": data or {},
                "read": False,
                "created_at": created_at.isoformat() if created_at else None
            }
    
    async def register_device(self, user_id: str, fcm_token: str) -> bool:
        return True
    
    async def get_notifications(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Notification)
                .where(Notification.user_id == user_id)
                .order_by(Notification.created_at.desc())
                .limit(limit)
            )
            notifications = result.scalars().all()
            
            return [
                {
                    "notification_id": n.notification_id,
                    "user_id": n.user_id,
                    "title": n.title,
                    "body": n.message,
                    "data": getattr(n, 'data', None) or {},
                    "read": bool(n.is_read),
                    "created_at": getattr(n, 'created_at', None).isoformat() if getattr(n, 'created_at', None) else None
                }
                for n in notifications
            ]
    
    async def mark_as_read(self, notification_id: str, user_id: str) -> bool:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Notification).where(
                    Notification.notification_id == notification_id,
                    Notification.user_id == user_id
                )
            )
            notification = result.scalar_one_or_none()
            
            if not notification:
                return False
            
            setattr(notification, 'is_read', True)
            await db.commit()
            return True

notification_service = NotificationService()
