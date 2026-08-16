"""
Password hashing and JWT token handling.

See docs/05-security-compliance.md §3: bcrypt for passwords, short-lived
JWT access tokens, opaque hashed refresh tokens (never store a raw refresh
token — see workspace_service.py in Batch 2 for how the hash gets stored).
"""

import secrets
from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expiry_minutes
    )
    payload = {"sub": user_id, "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str | None:
    """Returns the user_id if valid, None if invalid/expired."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload.get("sub")
    except JWTError:
        return None


def generate_refresh_token() -> str:
    """A random opaque token — NOT a JWT. Stored hashed in the DB (Invite/
    RefreshToken model), so a DB leak alone can't be used to log in."""
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    """Refresh tokens are hashed with the same bcrypt context before
    storage — never store the raw token (docs/05-security-compliance.md §3)."""
    return pwd_context.hash(token)


def verify_refresh_token(token: str, hashed: str) -> bool:
    return pwd_context.verify(token, hashed)