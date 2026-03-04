from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.db_models import User
from app.routes.auth import get_current_user_full
from app.services.messaging import messaging_service
from typing import Optional

router = APIRouter(prefix="/messages", tags=["messaging"])

class SendMessageRequest(BaseModel):
    receiver_id: str
    message: str
    conversation_id: Optional[str] = None

@router.post("/send")
async def send_message(request: SendMessageRequest, user: User = Depends(get_current_user_full)):
    result = await messaging_service.send_message(
        sender_id=user.user_id,
        receiver_id=request.receiver_id,
        message=request.message,
        conversation_id=request.conversation_id
    )
    return result

@router.get("/conversations")
async def get_conversations(user: User = Depends(get_current_user_full)):
    conversations = await messaging_service.get_conversations(user.user_id)
    return conversations

@router.get("/conversation/{conversation_id}")
async def get_messages(conversation_id: str, limit: int = 50, user: User = Depends(get_current_user_full)):
    messages = await messaging_service.get_messages(conversation_id, user.user_id, limit)
    return messages
