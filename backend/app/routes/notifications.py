from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from app.models.db_models import User
from app.routes.auth import get_current_user_full
from app.services.notifications import notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])

class RegisterDeviceRequest(BaseModel):
    fcm_token: str

@router.post("/register-device")
async def register_device(request: RegisterDeviceRequest, user: User = Depends(get_current_user_full)):
    success = await notification_service.register_device(user.user_id, request.fcm_token)
    return {"success": success}

@router.get("/")
async def get_notifications(limit: int = 50, user: User = Depends(get_current_user_full)):
    notifications = await notification_service.get_notifications(user.user_id, limit)
    return notifications

@router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: str, user: User = Depends(get_current_user_full)):
    success = await notification_service.mark_as_read(notification_id, user.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}
