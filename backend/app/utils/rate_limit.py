from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request

limiter = Limiter(key_func=get_remote_address)

def get_rate_limit_key(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:20]
    return get_remote_address(request)

RATE_LIMITS = {
    "auth": "10/minute",
    "chat": "20/minute",
    "booking": "30/minute",
    "search": "60/minute",
    "default": "100/minute"
}
