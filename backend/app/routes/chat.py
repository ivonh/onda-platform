from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import os
import json
from datetime import datetime, timedelta
from openai import OpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.db_models import User, Stylist, Booking, BlockedTime, StylistPricing
from app.routes.auth import get_current_user_optional

router = APIRouter(prefix="/chat", tags=["chat"])

client = OpenAI(
    api_key=os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY"),
    base_url=os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL"),
)

SYSTEM_PROMPT = """You are a friendly and helpful beauty concierge assistant for Onda, a premium beauty booking platform in Australia and New Zealand. 

Your capabilities:
1. Help clients find available beauty professionals (hairstylists, makeup artists, nail technicians, etc.)
2. Check real-time availability for specific times and dates
3. Provide pricing information for services
4. Answer questions about services and booking

When users ask about booking or availability:
- Use the find_available_stylists function to search for stylists with open slots
- Use the check_stylist_availability function to check specific stylist availability
- Provide helpful suggestions based on real data
- If functions return errors or no results, explain this helpfully and suggest alternatives

Important limitations:
- You can SEARCH and CHECK availability but cannot CREATE bookings directly
- When a user wants to book, direct them to visit the stylist's profile page to complete the booking
- Only stylists who have set up their working hours will appear in availability searches

Key platform information:
- We connect clients with elite beauty professionals across Australia and New Zealand
- Travel fees: $1.20 AUD per km after the first 10km free when stylist travels to client
- Platform fee: 15% on service price
- All stylists are vetted professionals with portfolio galleries

Response guidelines:
- Be warm, professional, and concise
- When showing availability results, format them nicely with stylist name, rating, price, and service duration
- If no stylists are found, suggest trying different times or browsing all stylists
- Always offer to help find alternatives if the requested time isn't available"""


TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "find_available_stylists",
            "description": "Find stylists who offer a specific service and have availability around a requested time. Use this when a user asks about booking a service or finding available stylists.",
            "parameters": {
                "type": "object",
                "properties": {
                    "service_type": {
                        "type": "string",
                        "description": "The type of beauty service (e.g., 'haircut', 'hair styling', 'makeup', 'nails', 'facial', 'massage', 'waxing', 'eyelash extensions')"
                    },
                    "requested_date": {
                        "type": "string",
                        "description": "The date for the appointment in YYYY-MM-DD format. Use today's date if not specified."
                    },
                    "requested_time": {
                        "type": "string",
                        "description": "The preferred time in HH:MM format (24-hour). E.g., '14:00' for 2pm."
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Maximum number of stylists to return. Default is 5."
                    }
                },
                "required": ["service_type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_stylist_availability",
            "description": "Check a specific stylist's availability for a given date. Use this when a user asks about a specific stylist's schedule.",
            "parameters": {
                "type": "object",
                "properties": {
                    "stylist_name": {
                        "type": "string",
                        "description": "The name of the stylist to check"
                    },
                    "date": {
                        "type": "string",
                        "description": "The date to check in YYYY-MM-DD format"
                    }
                },
                "required": ["stylist_name", "date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_service_pricing",
            "description": "Get pricing information for a specific service type across available stylists.",
            "parameters": {
                "type": "object",
                "properties": {
                    "service_type": {
                        "type": "string",
                        "description": "The type of beauty service to get pricing for"
                    }
                },
                "required": ["service_type"]
            }
        }
    }
]


class ChatMessage(BaseModel):
    role: str
    content: str


class UserContext(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    suburb: Optional[str] = None


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[str] = None
    user_context: Optional[UserContext] = None


class ChatResponse(BaseModel):
    message: str
    success: bool
    booking_suggestion: Optional[dict] = None


async def find_available_stylists_func(
    db: AsyncSession,
    service_type: str,
    requested_date: Optional[str] = None,
    requested_time: Optional[str] = None,
    max_results: int = 5
) -> str:
    try:
        now = datetime.now()
        target_date = datetime.strptime(requested_date, "%Y-%m-%d").date() if requested_date else now.date()
        target_time = datetime.strptime(requested_time, "%H:%M").time() if requested_time else now.time()
        target_datetime = datetime.combine(target_date, target_time)
        day_of_week = target_date.weekday()
        
        result = await db.execute(
            select(Stylist)
            .options(
                selectinload(Stylist.user),
                selectinload(Stylist.pricing),
                selectinload(Stylist.blocked_times),
                selectinload(Stylist.bookings)
            )
            .where(Stylist.is_verified == True)
        )
        stylists = result.scalars().all()
        
        available_stylists = []
        service_keywords = service_type.lower().split()
        
        for stylist in stylists:
            matching_service = None
            service_price = None
            service_duration = 60
            
            for pricing in stylist.pricing:
                service_name = (pricing.service_name or "").lower()
                if any(kw in service_name for kw in service_keywords):
                    matching_service = pricing.service_name
                    service_price = pricing.price
                    service_duration = pricing.duration_minutes or 60
                    break
            
            if not matching_service:
                skills = stylist.skills or []
                if any(any(kw in skill.lower() for kw in service_keywords) for skill in skills):
                    matching_service = service_type.title()
                    service_price = 50.00
                    service_duration = 60
            
            if not matching_service:
                continue
            
            availability_slots = stylist.availability_slots or []
            
            if not availability_slots:
                continue
            
            working_slot = None
            for slot in availability_slots:
                if slot.get("day_of_week") == day_of_week and slot.get("is_available", True):
                    working_slot = slot
                    break
            
            if not working_slot:
                continue
            
            slot_start_str = working_slot.get("start_time", "09:00")
            slot_end_str = working_slot.get("end_time", "17:00")
            try:
                slot_start = datetime.strptime(slot_start_str, "%H:%M").time()
                slot_end = datetime.strptime(slot_end_str, "%H:%M").time()
            except ValueError:
                continue
            
            requested_end_time = (datetime.combine(target_date, target_time) + timedelta(minutes=service_duration)).time()
            if target_time < slot_start or requested_end_time > slot_end:
                continue
            
            is_available = True
            
            for blocked in stylist.blocked_times:
                if blocked.start_datetime and blocked.end_datetime:
                    if blocked.start_datetime <= target_datetime <= blocked.end_datetime:
                        is_available = False
                        break
            
            if not is_available:
                continue
            
            for booking in stylist.bookings:
                if booking.status in ["confirmed", "pending"]:
                    if booking.scheduled_datetime:
                        booking_end = booking.scheduled_datetime + timedelta(minutes=booking.estimated_duration_minutes or 60)
                        requested_end = target_datetime + timedelta(minutes=service_duration)
                        if (target_datetime < booking_end and requested_end > booking.scheduled_datetime):
                            is_available = False
                            break
            
            if is_available:
                available_stylists.append({
                    "name": stylist.user.name if stylist.user else "Unknown",
                    "stylist_id": stylist.stylist_id,
                    "service": matching_service,
                    "price": float(service_price) if service_price else 50.0,
                    "duration_minutes": service_duration,
                    "rating": float(stylist.rating) if stylist.rating else 4.5,
                    "review_count": stylist.review_count or 0,
                    "suburb": stylist.service_areas[0] if stylist.service_areas else "Local Area"
                })
        
        available_stylists.sort(key=lambda x: (-x["rating"], x["price"]))
        available_stylists = available_stylists[:max_results]
        
        if not available_stylists:
            return json.dumps({
                "found": False,
                "message": f"No stylists found with availability for {service_type} on {target_date.strftime('%A, %B %d')} at {target_time.strftime('%I:%M %p')}. This could be because stylists haven't set their working hours, or the time falls outside their schedule. Try a different time or date.",
                "suggestions": ["Try a different time", "Check another day", "Browse all stylists to see their schedules"]
            })
        
        return json.dumps({
            "found": True,
            "date": target_date.strftime("%A, %B %d, %Y"),
            "time": target_time.strftime("%I:%M %p"),
            "service": service_type,
            "stylists": available_stylists,
            "count": len(available_stylists)
        })
        
    except Exception as e:
        return json.dumps({"error": str(e), "found": False})


async def check_stylist_availability_func(
    db: AsyncSession,
    stylist_name: str,
    date: str
) -> str:
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
        day_of_week = target_date.weekday()
        
        result = await db.execute(
            select(Stylist)
            .options(
                selectinload(Stylist.user),
                selectinload(Stylist.blocked_times),
                selectinload(Stylist.bookings)
            )
            .join(User)
            .where(User.name.ilike(f"%{stylist_name}%"))
        )
        stylist = result.scalars().first()
        
        if not stylist:
            return json.dumps({
                "found": False,
                "message": f"Could not find a stylist named '{stylist_name}'. Please check the spelling or browse available stylists."
            })
        
        working_hours = None
        availability_slots = stylist.availability_slots or []
        for slot in availability_slots:
            if slot.get("day_of_week") == day_of_week and slot.get("is_available", True):
                working_hours = {
                    "start": slot.get("start_time", "09:00"),
                    "end": slot.get("end_time", "17:00")
                }
                break
        
        if not working_hours and availability_slots:
            day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            return json.dumps({
                "found": True,
                "stylist_name": stylist.user.name if stylist.user else stylist_name,
                "date": target_date.strftime("%A, %B %d, %Y"),
                "available": False,
                "message": f"{stylist.user.name if stylist.user else stylist_name} is not working on {day_names[day_of_week]}s."
            })
        
        if not working_hours:
            working_hours = {"start": "09:00", "end": "17:00"}
        
        booked_times = []
        for booking in stylist.bookings:
            if booking.status in ["confirmed", "pending"] and booking.scheduled_datetime:
                if booking.scheduled_datetime.date() == target_date:
                    end_time = booking.scheduled_datetime + timedelta(minutes=booking.estimated_duration_minutes or 60)
                    booked_times.append({
                        "start": booking.scheduled_datetime.strftime("%I:%M %p"),
                        "end": end_time.strftime("%I:%M %p"),
                        "service": booking.services[0] if booking.services else "Appointment"
                    })
        
        return json.dumps({
            "found": True,
            "stylist_name": stylist.user.name if stylist.user else stylist_name,
            "stylist_id": stylist.stylist_id,
            "date": target_date.strftime("%A, %B %d, %Y"),
            "working_hours": working_hours,
            "booked_slots": booked_times,
            "available": True
        })
        
    except Exception as e:
        return json.dumps({"error": str(e), "found": False})


async def get_service_pricing_func(
    db: AsyncSession,
    service_type: str
) -> str:
    try:
        result = await db.execute(
            select(StylistPricing)
            .options(selectinload(StylistPricing.stylist).selectinload(Stylist.user))
            .where(StylistPricing.service_name.ilike(f"%{service_type}%"))
        )
        pricing_entries = result.scalars().all()
        
        if not pricing_entries:
            return json.dumps({
                "found": False,
                "message": f"No pricing information found for '{service_type}'. Try searching for specific services like 'haircut', 'highlights', 'makeup', etc."
            })
        
        prices = []
        for entry in pricing_entries:
            stylist_name = entry.stylist.user.name if entry.stylist and entry.stylist.user else "Unknown"
            prices.append({
                "stylist_name": stylist_name,
                "service_name": entry.service_name,
                "price": float(entry.price) if entry.price else 0,
                "duration_minutes": entry.duration_minutes
            })
        
        prices.sort(key=lambda x: x["price"])
        
        min_price = min(p["price"] for p in prices)
        max_price = max(p["price"] for p in prices)
        avg_price = sum(p["price"] for p in prices) / len(prices)
        
        return json.dumps({
            "found": True,
            "service_type": service_type,
            "price_range": {"min": min_price, "max": max_price, "average": round(avg_price, 2)},
            "pricing_details": prices[:10],
            "count": len(prices)
        })
        
    except Exception as e:
        return json.dumps({"error": str(e), "found": False})


async def process_function_call(
    function_name: str,
    arguments: dict,
    db: AsyncSession
) -> str:
    if function_name == "find_available_stylists":
        return await find_available_stylists_func(
            db=db,
            service_type=arguments.get("service_type", ""),
            requested_date=arguments.get("requested_date"),
            requested_time=arguments.get("requested_time"),
            max_results=arguments.get("max_results", 5)
        )
    elif function_name == "check_stylist_availability":
        return await check_stylist_availability_func(
            db=db,
            stylist_name=arguments.get("stylist_name", ""),
            date=arguments.get("date", datetime.now().strftime("%Y-%m-%d"))
        )
    elif function_name == "get_service_pricing":
        return await get_service_pricing_func(
            db=db,
            service_type=arguments.get("service_type", "")
        )
    else:
        return json.dumps({"error": f"Unknown function: {function_name}"})


@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    try:
        now = datetime.now()
        context_parts = [
            f"Current date and time: {now.strftime('%A, %B %d, %Y at %I:%M %p')}",
            f"Timezone: Australia/Brisbane (AEST)"
        ]
        
        if current_user:
            context_parts.append(f"User is logged in as: {current_user.name}")
            context_parts.append(f"User role: {current_user.role}")
        
        if request.user_context:
            if request.user_context.suburb:
                context_parts.append(f"User location: {request.user_context.suburb}")
        
        if request.context:
            context_parts.append(f"Additional context: {request.context}")
        
        context_message = "\n".join(context_parts)
        
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "system", "content": context_message}
        ]
        
        for msg in request.messages[-10:]:
            if msg.role == "user":
                messages.append({"role": "user", "content": msg.content})
            elif msg.role == "assistant":
                messages.append({"role": "assistant", "content": msg.content})
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            max_tokens=800,
            temperature=0.7,
        )
        
        response_message = response.choices[0].message
        
        if response_message.tool_calls:
            messages.append(response_message)
            
            for tool_call in response_message.tool_calls:
                function_name = tool_call.function.name
                arguments = json.loads(tool_call.function.arguments)
                
                function_result = await process_function_call(function_name, arguments, db)
                
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": function_result
                })
            
            second_response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=800,
                temperature=0.7,
            )
            
            assistant_message = second_response.choices[0].message.content or ""
        else:
            assistant_message = response_message.content or ""
        
        return ChatResponse(message=assistant_message, success=True)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
