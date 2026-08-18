from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import ValidationError
from app.core.security import (
    hash_password, verify_password, create_access_token,
    generate_refresh_token, hash_refresh_token,
)
from app.repositories import user_repo, workspace_repo
from app.models.refresh_token import RefreshToken
from app.config import get_settings

settings = get_settings()


def register(db: Session, email: str, password: str, name: str, invite_token: str | None = None):
    if user_repo.get_by_email(db, email):
        raise ValidationError("Email already registered")

    user = user_repo.create(db, email=email, password_hash=hash_password(password), name=name)

    if invite_token:
        invite = workspace_repo.get_invite_by_token(db, invite_token)
        if invite and invite.accepted_at is None:
            workspace_repo.add_member(db, invite.workspace_id, user.id, invite.invited_role)
            invite.accepted_at = datetime.now(timezone.utc)
            db.commit()

    return user


def _issue_tokens(db: Session, user_id) -> dict:
    access_token = create_access_token(str(user_id))
    raw_refresh = generate_refresh_token()
    db.add(RefreshToken(
        user_id=user_id,
        token_hash=hash_refresh_token(raw_refresh),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expiry_days),
    ))
    db.commit()
    return {"access_token": access_token, "refresh_token": raw_refresh, "token_type": "bearer"}


def login(db: Session, email: str, password: str) -> dict:
    user = user_repo.get_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        raise ValidationError("Invalid email or password")
    return _issue_tokens(db, user.id)


def refresh(db: Session, raw_refresh_token: str) -> dict:
    token_hash = hash_refresh_token(raw_refresh_token)
    row = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash, RefreshToken.revoked.is_(False),
    ).first()
    if not row or row.expires_at < datetime.now(timezone.utc):
        raise ValidationError("Invalid or expired refresh token")
    row.revoked = True  # rotate: old one is now dead
    db.commit()
    return _issue_tokens(db, row.user_id)


def logout(db: Session, raw_refresh_token: str) -> None:
    token_hash = hash_refresh_token(raw_refresh_token)
    row = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if row:
        row.revoked = True
        db.commit()