from typing import List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, or_
from app.models.db_models import User, Message
from app.database import AsyncSessionLocal
import logging

logger = logging.getLogger(__name__)

class MessagingService:
    async def send_message(self, sender_id: str, receiver_id: str, message: str, conversation_id: str = None) -> Dict[str, Any]:
        async with AsyncSessionLocal() as db:
            new_message = Message(
                sender_id=sender_id,
                receiver_id=receiver_id,
                content=message
            )
            
            db.add(new_message)
            await db.commit()
            await db.refresh(new_message)
            
            return {
                "message_id": new_message.message_id,
                "conversation_id": f"{min(sender_id, receiver_id)}_{max(sender_id, receiver_id)}"
            }
    
    async def get_conversations(self, user_id: str) -> List[Dict[str, Any]]:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Message)
                .where(or_(Message.sender_id == user_id, Message.receiver_id == user_id))
                .order_by(Message.created_at.desc())
            )
            messages = result.scalars().all()
            
            conversations = {}
            for msg in messages:
                other_id = msg.receiver_id if msg.sender_id == user_id else msg.sender_id
                if other_id not in conversations:
                    user_result = await db.execute(select(User).where(User.user_id == other_id))
                    other_user = user_result.scalar_one_or_none()
                    
                    conversations[other_id] = {
                        "conversation_id": f"{min(user_id, other_id)}_{max(user_id, other_id)}",
                        "participants": [user_id, other_id],
                        "last_message": msg.content,
                        "last_message_at": msg.created_at.isoformat() if msg.created_at else None,
                        "other_user": {
                            "user_id": other_user.user_id,
                            "name": other_user.name,
                            "email": other_user.email,
                            "role": other_user.role
                        } if other_user else None,
                        "unread_count": 0
                    }
            
            unread_result = await db.execute(
                select(Message)
                .where(and_(Message.receiver_id == user_id, Message.is_read == False))
            )
            unread_messages = unread_result.scalars().all()
            
            for msg in unread_messages:
                other_id = msg.sender_id
                if other_id in conversations:
                    conversations[other_id]["unread_count"] += 1
            
            return list(conversations.values())
    
    async def get_messages(self, conversation_id: str, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        async with AsyncSessionLocal() as db:
            parts = conversation_id.split("_")
            if len(parts) != 2:
                return []
            
            user1_id, user2_id = parts
            
            if user_id not in [user1_id, user2_id]:
                return []
            
            result = await db.execute(
                select(Message)
                .where(
                    or_(
                        and_(Message.sender_id == user1_id, Message.receiver_id == user2_id),
                        and_(Message.sender_id == user2_id, Message.receiver_id == user1_id)
                    )
                )
                .order_by(Message.created_at.desc())
                .limit(limit)
            )
            messages = result.scalars().all()
            
            await db.execute(
                update(Message)
                .where(
                    and_(
                        or_(
                            and_(Message.sender_id == user1_id, Message.receiver_id == user2_id),
                            and_(Message.sender_id == user2_id, Message.receiver_id == user1_id)
                        ),
                        Message.receiver_id == user_id,
                        Message.is_read == False
                    )
                )
                .values(is_read=True)
            )
            await db.commit()
            
            result_list = [
                {
                    "message_id": m.message_id,
                    "sender_id": m.sender_id,
                    "receiver_id": m.receiver_id,
                    "message": m.content,
                    "created_at": m.created_at.isoformat() if m.created_at else None,
                    "read": m.is_read
                }
                for m in reversed(messages)
            ]
            
            return result_list

messaging_service = MessagingService()
