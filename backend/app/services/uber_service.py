import httpx
from app.config import settings
from typing import Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import logging
import math

logger = logging.getLogger(__name__)

class UberAPIService:
    def __init__(self):
        self.client_id = settings.uber_client_id
        self.client_secret = settings.uber_client_secret
        self.sandbox_mode = settings.uber_sandbox_mode
        self.auth_url = "https://sandbox-login.uber.com/oauth/v2/token" if self.sandbox_mode else "https://auth.uber.com/oauth/v2/token"
        self.api_base_url = "https://sandbox-api.uber.com" if self.sandbox_mode else "https://api.uber.com"
        self.access_token: Optional[str] = None
        self.token_expiry: Optional[datetime] = None
    
    async def get_access_token(self) -> str:
        if self.access_token and self.token_expiry and datetime.now(timezone.utc) < self.token_expiry:
            return self.access_token
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.auth_url,
                    data={
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "grant_type": "client_credentials",
                        "scope": "eats.deliveries"
                    },
                    timeout=10.0
                )
                response.raise_for_status()
                token_data = response.json()
                
                self.access_token = token_data["access_token"]
                expires_in = token_data.get("expires_in", 3600)
                self.token_expiry = datetime.now(timezone.utc) + timedelta(seconds=expires_in - 60)
                
                logger.info("Successfully obtained Uber API access token")
                return self.access_token
        except Exception as e:
            logger.error(f"Failed to obtain Uber access token: {str(e)}")
            return None
    
    async def get_price_estimate(self, start_lat: float, start_lng: float, end_lat: float, end_lng: float) -> Dict[str, Any]:
        token = await self.get_access_token()
        if not token:
            distance_miles = self.calculate_distance(start_lat, start_lng, end_lat, end_lng)
            estimated_duration = distance_miles * 2.5
            base_fare = 5.0
            per_minute_rate = 0.35
            per_mile_rate = 1.75
            booking_fee = 2.5
            
            time_charge = estimated_duration * per_minute_rate
            distance_charge = distance_miles * per_mile_rate
            total = base_fare + time_charge + distance_charge + booking_fee
            
            return {
                "prices": [{
                    "display_name": "Standard",
                    "estimate": f"${total:.2f}",
                    "low_estimate": total * 0.9,
                    "high_estimate": total * 1.1,
                    "distance": distance_miles,
                    "duration": estimated_duration * 60
                }]
            }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_base_url}/v1.2/estimates/price",
                    params={
                        "start_latitude": start_lat,
                        "start_longitude": start_lng,
                        "end_latitude": end_lat,
                        "end_longitude": end_lng
                    },
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=10.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to get Uber price estimate: {str(e)}")
            distance_miles = self.calculate_distance(start_lat, start_lng, end_lat, end_lng)
            estimated_duration = distance_miles * 2.5
            base_fare = 5.0
            per_minute_rate = 0.35
            per_mile_rate = 1.75
            booking_fee = 2.5
            
            time_charge = estimated_duration * per_minute_rate
            distance_charge = distance_miles * per_mile_rate
            total = base_fare + time_charge + distance_charge + booking_fee
            
            return {
                "prices": [{
                    "display_name": "Standard",
                    "estimate": f"${total:.2f}",
                    "low_estimate": total * 0.9,
                    "high_estimate": total * 1.1,
                    "distance": distance_miles,
                    "duration": estimated_duration * 60
                }]
            }
    
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 3959
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = math.sin(delta_lat/2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2) ** 2
        c = 2 * math.asin(math.sqrt(a))
        distance = R * c
        
        return distance

uber_service = UberAPIService()
