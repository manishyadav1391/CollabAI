from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.ai import AskRequest
from app.services import ai_service
from app.core.rate_limit import check_rate_limit

router = APIRouter()


@router.post("/ask")
def ask(
    payload: AskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    check_rate_limit(f"ai_ask:user:{current_user.id}", max_requests=30, window_seconds=3600)
    return StreamingResponse(
        ai_service.ask_stream(db, current_user.id, payload.project_id, payload.question),
        media_type="text/event-stream",
    )