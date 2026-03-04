from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from datetime import datetime, timezone
import secrets
import os
import uuid

from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
)
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
    ResidentKeyRequirement,
    AuthenticatorTransport,
    PublicKeyCredentialDescriptor,
)
from webauthn.helpers.cose import COSEAlgorithmIdentifier
from webauthn.helpers import bytes_to_base64url, base64url_to_bytes

from app.database import get_db
from app.models.db_models import User
from app.utils.security import create_access_token, hash_password

router = APIRouter(prefix="/passkey", tags=["passkey"])

_replit_domain = os.environ.get("REPLIT_DEV_DOMAIN", "")
_default_rp_id = _replit_domain if _replit_domain else "localhost"
_default_origin = f"https://{_replit_domain}" if _replit_domain else "http://localhost:5000"

RP_ID = os.environ.get("WEBAUTHN_RP_ID", _default_rp_id)
RP_NAME = os.environ.get("WEBAUTHN_RP_NAME", "Onda")
ORIGIN = os.environ.get("WEBAUTHN_ORIGIN", _default_origin)

_challenges: dict = {}
_passkeys: dict = {}

class RegistrationOptionsRequest(BaseModel):
    email: str
    display_name: str

class RegistrationVerifyRequest(BaseModel):
    email: str
    credential: dict

class AuthenticationOptionsRequest(BaseModel):
    email: str

class AuthenticationVerifyRequest(BaseModel):
    email: str
    credential: dict

class UserResponseModel(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    created_at: datetime

class TokenResponseModel(BaseModel):
    access_token: str
    user: UserResponseModel

@router.post("/register/options")
async def registration_options(request: RegistrationOptionsRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        user_id = existing_user.user_id.encode()
    else:
        user_id = str(uuid.uuid4()).encode()
    
    existing_passkeys = _passkeys.get(request.email, [])
    exclude_credentials = [
        PublicKeyCredentialDescriptor(
            id=base64url_to_bytes(pk["credential_id"]),
            transports=[AuthenticatorTransport.INTERNAL, AuthenticatorTransport.HYBRID]
        )
        for pk in existing_passkeys
    ]
    
    options = generate_registration_options(
        rp_id=RP_ID,
        rp_name=RP_NAME,
        user_id=user_id,
        user_name=request.email,
        user_display_name=request.display_name,
        authenticator_selection=AuthenticatorSelectionCriteria(
            resident_key=ResidentKeyRequirement.REQUIRED,
            user_verification=UserVerificationRequirement.REQUIRED,
        ),
        supported_pub_key_algs=[
            COSEAlgorithmIdentifier.ECDSA_SHA_256,
            COSEAlgorithmIdentifier.RSASSA_PKCS1_v1_5_SHA_256,
        ],
        exclude_credentials=exclude_credentials,
    )
    
    _challenges[request.email] = options.challenge
    
    return {
        "rp": {"id": RP_ID, "name": RP_NAME},
        "user": {
            "id": bytes_to_base64url(user_id),
            "name": request.email,
            "displayName": request.display_name,
        },
        "challenge": bytes_to_base64url(options.challenge),
        "pubKeyCredParams": [
            {"type": "public-key", "alg": alg.value} for alg in options.pub_key_cred_params
        ],
        "timeout": options.timeout,
        "authenticatorSelection": {
            "residentKey": "required",
            "userVerification": "required",
        },
        "excludeCredentials": [
            {"type": "public-key", "id": bytes_to_base64url(c.id)}
            for c in exclude_credentials
        ],
    }

@router.post("/register/verify", response_model=TokenResponseModel)
async def registration_verify(request: RegistrationVerifyRequest, db: AsyncSession = Depends(get_db)):
    expected_challenge = _challenges.pop(request.email, None)
    if not expected_challenge:
        raise HTTPException(status_code=400, detail="Registration session expired or invalid")
    
    try:
        verification = verify_registration_response(
            credential=request.credential,
            expected_challenge=expected_challenge,
            expected_rp_id=RP_ID,
            expected_origin=ORIGIN,
            require_user_verification=True,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Verification failed: {str(e)}")
    
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    
    if not user:
        random_password = secrets.token_urlsafe(32)
        user = User(
            email=request.email,
            name=request.credential.get("response", {}).get("displayName", request.email.split("@")[0]),
            hashed_password=hash_password(random_password),
            role="client"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    passkey_data = {
        "credential_id": bytes_to_base64url(verification.credential_id),
        "public_key": bytes_to_base64url(verification.credential_public_key),
        "sign_count": verification.sign_count,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    
    if request.email not in _passkeys:
        _passkeys[request.email] = []
    _passkeys[request.email].append(passkey_data)
    
    _challenges.pop(request.email, None)
    
    access_token = create_access_token({"sub": user.user_id, "role": user.role})
    
    return TokenResponseModel(
        access_token=access_token,
        user=UserResponseModel(
            user_id=user.user_id,
            email=user.email,
            name=user.name,
            role=user.role,
            created_at=user.created_at or datetime.now(timezone.utc)
        )
    )

@router.post("/authenticate/options")
async def authentication_options(request: AuthenticationOptionsRequest, db: AsyncSession = Depends(get_db)):
    passkeys = _passkeys.get(request.email, [])
    
    if not passkeys:
        raise HTTPException(status_code=400, detail="No passkeys registered for this email")
    
    allow_credentials = [
        PublicKeyCredentialDescriptor(
            id=base64url_to_bytes(pk["credential_id"]),
            transports=[AuthenticatorTransport.INTERNAL, AuthenticatorTransport.HYBRID]
        )
        for pk in passkeys
    ]
    
    options = generate_authentication_options(
        rp_id=RP_ID,
        allow_credentials=allow_credentials,
        user_verification=UserVerificationRequirement.REQUIRED,
    )
    
    _challenges[request.email] = options.challenge
    
    return {
        "challenge": bytes_to_base64url(options.challenge),
        "timeout": options.timeout,
        "rpId": RP_ID,
        "allowCredentials": [
            {"type": "public-key", "id": bytes_to_base64url(c.id)}
            for c in allow_credentials
        ],
        "userVerification": "required",
    }

@router.post("/authenticate/verify", response_model=TokenResponseModel)
async def authentication_verify(request: AuthenticationVerifyRequest, db: AsyncSession = Depends(get_db)):
    expected_challenge = _challenges.pop(request.email, None)
    if not expected_challenge:
        raise HTTPException(status_code=400, detail="Authentication session expired or invalid")
    
    passkeys = _passkeys.get(request.email, [])
    if not passkeys:
        raise HTTPException(status_code=400, detail="No passkeys registered")
    
    credential_id = request.credential.get("id")
    passkey = next((pk for pk in passkeys if pk["credential_id"] == credential_id), None)
    
    if not passkey:
        raise HTTPException(status_code=400, detail="Passkey not found")
    
    try:
        verification = verify_authentication_response(
            credential=request.credential,
            expected_challenge=expected_challenge,
            expected_rp_id=RP_ID,
            expected_origin=ORIGIN,
            credential_public_key=base64url_to_bytes(passkey["public_key"]),
            credential_current_sign_count=passkey["sign_count"],
            require_user_verification=True,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")
    
    passkey["sign_count"] = verification.new_sign_count
    
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    access_token = create_access_token({"sub": user.user_id, "role": user.role})
    
    return TokenResponseModel(
        access_token=access_token,
        user=UserResponseModel(
            user_id=user.user_id,
            email=user.email,
            name=user.name,
            role=user.role,
            created_at=user.created_at or datetime.now(timezone.utc)
        )
    )

@router.get("/check/{email}")
async def check_passkey(email: str):
    passkeys = _passkeys.get(email, [])
    return {
        "has_passkey": len(passkeys) > 0,
        "passkey_count": len(passkeys)
    }
