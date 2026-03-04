import os
import secrets
import logging

logger = logging.getLogger(__name__)

class Settings:
    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL", "")
        jwt_key = os.getenv("JWT_SECRET_KEY", "")
        if not jwt_key:
            jwt_key = secrets.token_hex(32)
            logger.warning("JWT_SECRET_KEY not set - using auto-generated key. Sessions will not persist across restarts. Set JWT_SECRET_KEY in environment variables for production.")
        self.jwt_secret_key = jwt_key
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        self.jwt_expire_minutes = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))
        self.stripe_api_key = os.getenv("STRIPE_API_KEY", "")
        self.turnstile_secret = os.getenv("CLOUDFLARE_TURNSTILE_SECRET_KEY", "")
        self.uber_client_id = os.getenv("UBER_CLIENT_ID", "")
        self.uber_client_secret = os.getenv("UBER_CLIENT_SECRET", "")
        self.uber_sandbox_mode = os.getenv("UBER_SANDBOX_MODE", "true").lower() == "true"

settings = Settings()
