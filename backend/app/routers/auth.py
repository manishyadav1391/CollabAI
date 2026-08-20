from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.exceptions import ValidationError
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest, UserResponse
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