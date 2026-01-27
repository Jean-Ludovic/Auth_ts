import secrets
import hashlib
from datetime import datetime, timedelta
from .config import settings

def generate_reset_token() -> str:
    # token lisible URL, robuste
    return secrets.token_urlsafe(48)

def hash_token(token: str) -> str:
    # hash + "pepper" (secret serveur)
    payload = (token + settings.JWT_SECRET).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()

def expires_at(minutes: int) -> datetime:
    return datetime.utcnow() + timedelta(minutes=minutes)
