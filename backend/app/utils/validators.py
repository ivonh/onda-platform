import re
import phonenumbers
from phonenumbers import NumberParseException
from typing import Tuple, Optional

def validate_password(password: str) -> Tuple[bool, Optional[str]]:
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    return True, None

def validate_phone_number(phone: str, region: str = "AU") -> Tuple[bool, Optional[str], Optional[str]]:
    if not phone:
        return True, None, None
    
    try:
        parsed = phonenumbers.parse(phone, region)
        if not phonenumbers.is_valid_number(parsed):
            if region == "AU":
                return False, "Please enter a valid Australian phone number", None
            elif region == "NZ":
                return False, "Please enter a valid New Zealand phone number", None
            return False, "Please enter a valid phone number", None
        
        formatted = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
        return True, None, formatted
    except NumberParseException:
        return False, "Invalid phone number format. Use format: +61 4XX XXX XXX", None

def sanitize_service_name(service: str) -> str:
    sanitized = re.sub(r'[^a-zA-Z0-9\s\-_]', '', service)
    return sanitized.strip()[:100]

def validate_email_format(email: str) -> Tuple[bool, Optional[str]]:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return False, "Please enter a valid email address"
    return True, None
