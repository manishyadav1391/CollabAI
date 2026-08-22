from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user
from app.core.exceptions import ValidationError
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse, RefreshRequest, UserResponse,
    ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest,
)
from app.services import auth_service
from app.core.rate_limit import check_rate_limit

router = APIRouter()


@router.post("/register", response_model=UserResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user = auth_service.register(
            db, email=payload.email, password=payload.password,
            name=payload.name, invite_token=payload.invite_token,
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(f"login:ip:{client_ip}", max_requests=10, window_seconds=300)
    check_rate_limit(f"login:email:{payload.email}", max_requests=5, window_seconds=300)

    try:
        tokens = auth_service.login(db, payload.email, payload.password)
    except ValidationError as e:
        raise HTTPException(status_code=401, detail=str(e))
    return tokens


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    try:
        tokens = auth_service.refresh(db, payload.refresh_token)
    except ValidationError as e:
        raise HTTPException(status_code=401, detail=str(e))
    return tokens


@router.post("/logout")
def logout(payload: RefreshRequest, db: Session = Depends(get_db)):
    auth_service.logout(db, payload.refresh_token)
    return {"status": "logged out"}


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(f"forgot-password:ip:{client_ip}", max_requests=10, window_seconds=3600)
    check_rate_limit(f"forgot-password:email:{payload.email}", max_requests=3, window_seconds=3600)

    auth_service.request_password_reset(db, payload.email)
    # Generic response regardless of outcome — never reveal whether the email is registered.
    return {"status": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        auth_service.reset_password(db, payload.token, payload.new_password)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"status": "Password has been reset. Please log in again."}


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        auth_service.change_password(db, current_user, payload.current_password, payload.new_password)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"status": "Password changed. Please log in again on other devices."}