from fastapi import APIRouter, HTTPException, status, Depends, Request
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models.db_models import User, Stylist, PasswordResetToken
from app.utils.security import hash_password, verify_password, create_access_token, verify_token
from app.utils.validators import validate_password, validate_phone_number
from app.services.email_service import email_service
from datetime import datetime, timezone, timedelta, date
from typing import Optional
import secrets
import logging
import os

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["authentication"])

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    role: str = "client"
    phone: Optional[str] = None
    
    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v):
        is_valid, error_msg = validate_password(v)
        if not is_valid:
            raise ValueError(error_msg)
        return v
    
    @field_validator('phone')
    @classmethod
    def validate_phone_format(cls, v):
        if not v:
            return v
        is_valid, error_msg, formatted = validate_phone_number(v, "AU")
        if not is_valid:
            raise ValueError(error_msg)
        return formatted or v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def validate_password_strength(cls, v):
        is_valid, error_msg = validate_password(v)
        if not is_valid:
            raise ValueError(error_msg)
        return v

class AdminSetupVerifyRequest(BaseModel):
    setup_code: str

class AdminSetupCreateRequest(BaseModel):
    setup_code: str
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    
    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v):
        is_valid, error_msg = validate_password(v)
        if not is_valid:
            raise ValueError(error_msg)
        return v

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    user: UserResponse

def build_user_response(user) -> UserResponse:
    first = getattr(user, 'first_name', None) or ''
    last = getattr(user, 'last_name', None) or ''
    full_name = f"{first} {last}".strip() if (first or last) else (getattr(user, 'name', '') or '')
    return UserResponse(
        user_id=user.user_id,
        email=user.email,
        name=full_name,
        first_name=first or None,
        last_name=last or None,
        role=user.role,
        created_at=user.created_at or datetime.now(timezone.utc)
    )

async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return payload.get("sub"), payload.get("role", "client")

async def get_current_user_full(request: Request, db: AsyncSession = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


async def get_current_user_optional(request: Request, db: AsyncSession = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    token = auth_header.split(" ")[1]
    payload = verify_token(token)
    
    if not payload:
        return None
    
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    
    return user

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")
    
    first_name = user_data.first_name or ''
    last_name = user_data.last_name or ''
    if not first_name and user_data.name:
        parts = user_data.name.strip().split(' ', 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ''
    
    if not first_name:
        raise HTTPException(status_code=422, detail="First name is required")
    
    full_name = f"{first_name} {last_name}".strip()
    
    dob = None
    if user_data.date_of_birth:
        try:
            dob_date = date.fromisoformat(user_data.date_of_birth)
            today = date.today()
            age = today.year - dob_date.year - ((today.month, today.day) < (dob_date.month, dob_date.day))
            if age < 18:
                raise HTTPException(status_code=422, detail="You must be at least 18 years old to register")
            dob = datetime(dob_date.year, dob_date.month, dob_date.day, tzinfo=timezone.utc)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid date of birth format. Use YYYY-MM-DD")
    
    new_user = User(
        email=user_data.email,
        name=full_name,
        first_name=first_name,
        last_name=last_name,
        date_of_birth=dob,
        phone=user_data.phone,
        hashed_password=hash_password(user_data.password),
        role=user_data.role
    )
    
    try:
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")
    
    access_token = create_access_token({"sub": new_user.user_id, "role": new_user.role})
    
    return TokenResponse(
        access_token=access_token,
        user=build_user_response(new_user)
    )

@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token({"sub": user.user_id, "role": user.role})
    
    return TokenResponse(
        access_token=access_token,
        user=build_user_response(user)
    )

@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user_full)):
    return build_user_response(user)

@router.post("/forgot-password")
async def forgot_password(request_data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request_data.email))
    user = result.scalar_one_or_none()
    
    if not user:
        return {"message": "If an account with that email exists, a password reset link has been sent."}
    
    token_str = secrets.token_urlsafe(48)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    reset_token = PasswordResetToken(
        token=token_str,
        user_id=user.user_id,
        expires_at=expires_at
    )
    db.add(reset_token)
    await db.commit()
    
    frontend_url = os.environ.get("FRONTEND_URL", "")
    if not frontend_url:
        replit_domain = os.environ.get("REPLIT_DEV_DOMAIN", "")
        if replit_domain:
            frontend_url = f"https://{replit_domain}"
    
    reset_link = f"{frontend_url}/reset-password?token={token_str}"
    
    await email_service.send_password_reset(user.email, user.name, reset_link)
    
    logger.info(f"Password reset requested for {request_data.email}")
    
    return {"message": "If an account with that email exists, a password reset link has been sent."}

@router.post("/reset-password")
async def reset_password(request_data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PasswordResetToken).where(
            and_(
                PasswordResetToken.token == request_data.token,
                PasswordResetToken.used == False,
                PasswordResetToken.expires_at > datetime.now(timezone.utc)
            )
        )
    )
    reset_token = result.scalar_one_or_none()
    
    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link. Please request a new one.")
    
    result = await db.execute(select(User).where(User.user_id == reset_token.user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = hash_password(request_data.new_password)
    reset_token.used = True
    
    await db.commit()
    
    logger.info(f"Password reset completed for user {user.email}")
    
    return {"message": "Password has been reset successfully. You can now sign in with your new password."}

@router.post("/admin-setup/verify-code")
async def admin_setup_verify(data: AdminSetupVerifyRequest):
    setup_code = os.environ.get("ADMIN_SETUP_CODE", "")
    if not setup_code:
        raise HTTPException(status_code=403, detail="Admin setup is not configured")
    
    if data.setup_code != setup_code:
        raise HTTPException(status_code=403, detail="Invalid setup code")
    
    return {"message": "Code verified"}

@router.post("/admin-setup/create", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def admin_setup_create(data: AdminSetupCreateRequest, db: AsyncSession = Depends(get_db)):
    setup_code = os.environ.get("ADMIN_SETUP_CODE", "")
    if not setup_code:
        raise HTTPException(status_code=403, detail="Admin setup is not configured")
    
    if data.setup_code != setup_code:
        raise HTTPException(status_code=403, detail="Invalid setup code")
    
    result = await db.execute(select(User).where(User.email == data.email))
    existing = result.scalar_one_or_none()
    
    if existing:
        if existing.role != "admin":
            existing.role = "admin"
            existing.first_name = data.first_name
            existing.last_name = data.last_name
            existing.name = f"{data.first_name} {data.last_name}".strip()
            await db.commit()
            await db.refresh(existing)
            
            await email_service.send_admin_onboarding(
                to_email=existing.email,
                admin_name=existing.name,
                setup_link=""
            )
            
            access_token = create_access_token({"sub": existing.user_id, "role": "admin"})
            return TokenResponse(
                access_token=access_token,
                user=build_user_response(existing)
            )
        raise HTTPException(status_code=409, detail="Admin account already exists with this email")
    
    full_name = f"{data.first_name} {data.last_name}".strip()
    
    new_user = User(
        email=data.email,
        name=full_name,
        first_name=data.first_name,
        last_name=data.last_name,
        hashed_password=hash_password(data.password),
        role="admin"
    )
    
    try:
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")
    
    await email_service.send_admin_onboarding(
        to_email=new_user.email,
        admin_name=new_user.name,
        setup_link=""
    )
    
    access_token = create_access_token({"sub": new_user.user_id, "role": "admin"})
    
    logger.info(f"Admin account created: {data.email}")
    
    return TokenResponse(
        access_token=access_token,
        user=build_user_response(new_user)
    )
