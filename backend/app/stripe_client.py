import os
import httpx
import stripe
from typing import Optional

_stripe_credentials = None

async def get_stripe_credentials():
    """Fetch Stripe credentials from Replit connection API"""
    global _stripe_credentials
    
    if _stripe_credentials:
        return _stripe_credentials
    
    hostname = os.environ.get("REPLIT_CONNECTORS_HOSTNAME")
    repl_identity = os.environ.get("REPL_IDENTITY")
    web_repl_renewal = os.environ.get("WEB_REPL_RENEWAL")
    
    if repl_identity:
        x_replit_token = f"repl {repl_identity}"
    elif web_repl_renewal:
        x_replit_token = f"depl {web_repl_renewal}"
    else:
        return {"publishable_key": None, "secret_key": os.environ.get("STRIPE_API_KEY", "")}
    
    if not hostname:
        return {"publishable_key": None, "secret_key": os.environ.get("STRIPE_API_KEY", "")}
    
    is_production = os.environ.get("REPLIT_DEPLOYMENT") == "1"
    target_environment = "production" if is_production else "development"
    
    url = f"https://{hostname}/api/v2/connection"
    params = {
        "include_secrets": "true",
        "connector_names": "stripe",
        "environment": target_environment
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                params=params,
                headers={
                    "Accept": "application/json",
                    "X_REPLIT_TOKEN": x_replit_token
                }
            )
            data = response.json()
            
            connection = data.get("items", [{}])[0] if data.get("items") else {}
            settings = connection.get("settings", {})
            
            if settings.get("publishable") and settings.get("secret"):
                _stripe_credentials = {
                    "publishable_key": settings["publishable"],
                    "secret_key": settings["secret"]
                }
                return _stripe_credentials
    except Exception as e:
        print(f"Failed to fetch Stripe credentials: {e}")
    
    return {"publishable_key": None, "secret_key": os.environ.get("STRIPE_API_KEY", "")}

async def get_stripe_client():
    """Get configured Stripe client"""
    credentials = await get_stripe_credentials()
    stripe.api_key = credentials["secret_key"]
    return stripe

async def get_stripe_publishable_key():
    """Get Stripe publishable key for frontend"""
    credentials = await get_stripe_credentials()
    return credentials["publishable_key"]
