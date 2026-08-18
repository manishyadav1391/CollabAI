"""
Password hashing and JWT token handling.

See docs/05-security-compliance.md §3: bcrypt for passwords, short-lived
JWT access tokens, opaque hashed refresh tokens (never store a raw refresh
token — see workspace_service.py in Batch 2 for how the hash gets stored).
"""

import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt, JWTError

from app.config import get_settings
import hashlib

settings = get_settings()

ALGORITHM = "HS256"


def hash_password(plain_password: str) -> str:
    pwd_bytes = plain_password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    pwd_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)


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
    """A random opaque token — NOT a JWT. Stored hashed in the DB, so a
    DB leak alone can't be used to log in."""
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    """Refresh tokens are high-entropy random strings, so a deterministic
    SHA-256 hash (not bcrypt) is used — this lets us look up a token by
    its hash directly in the database, which bcrypt's per-call salt would
    not allow. Passwords still use bcrypt above; this is a different
    threat model (looking up a known random token vs. guessing a
    low-entropy password)."""
    return hashlib.sha256(token.encode()).hexdigest()


def verify_refresh_token(token: str, hashed: str) -> bool:
    return hash_refresh_token(token) == hashed