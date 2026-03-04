import httpx
from app.config import settings
import logging
import os

logger = logging.getLogger(__name__)

async def verify_turnstile_token(token: str) -> bool:
    secret = settings.turnstile_secret or os.getenv("CLOUDFLARE_TURNSTILE_SECRET_KEY", "")
    
    if secret in ["1x00000000000000000000AA", "1x0000000000000000000000000000000AA", ""]:
        logger.info("Using test/empty Turnstile secret - bypassing verification")
        return True
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data={
                    "secret": secret,
                    "response": token
                },
                timeout=10.0
            )
            result = response.json()
            logger.info(f"Turnstile verification result: {result}")
            return result.get("success", False)
    except Exception as e:
        logger.error(f"Turnstile verification failed: {str(e)}")
        logger.info("Bypassing Turnstile verification due to error")
        return True
