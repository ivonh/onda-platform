from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    CLIENT = "client"
    STYLIST = "stylist"

class ServiceCategory(str, Enum):
    HAIRCUT = "haircut"
    COLORING = "coloring"
    STYLING = "styling"
    FACIAL = "facial"
    NAILS = "nails"
    THREADING = "threading"
    WAXING = "waxing"
    COSMETIC_TATTOO = "cosmetic_tattoo"
    MASSAGE = "massage"

class BookingStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class LocationModel(BaseModel):
    latitude: float
    longitude: float
    address: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=2, max_length=100)
    role: UserRole
    turnstile_token: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    turnstile_token: str

class StylistProfile(BaseModel):
    skills: List[ServiceCategory]
    bio: Optional[str] = None
    years_experience: Optional[int] = None
    service_area: LocationModel
    service_radius_miles: float = Field(default=10.0, ge=1, le=50)
    portfolio_images: List[str] = Field(default_factory=list)
    
class PricingItem(BaseModel):
    service: ServiceCategory
    price_min: float = Field(..., ge=0)
    price_max: float = Field(..., ge=0)
    duration_minutes: int = Field(..., ge=15)

class StylistRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=2, max_length=100)
    phone: str
    profile: StylistProfile
    pricing: List[PricingItem]
    turnstile_token: str

class BookingRequest(BaseModel):
    stylist_id: str
    services: List[ServiceCategory]
    preferred_datetime: datetime
    client_location: LocationModel
    notes: Optional[str] = None

class PriceEstimateRequest(BaseModel):
    stylist_id: str
    services: List[ServiceCategory]
    client_location: LocationModel

class RatingCreate(BaseModel):
    booking_id: str
    rating: int = Field(..., ge=1, le=5)
    feedback: Optional[str] = None

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    role: UserRole
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
