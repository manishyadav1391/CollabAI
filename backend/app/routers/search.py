from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.search import SearchResponse
from app.services import search_service

router = APIRouter()


@router.get("", response_model=SearchResponse)
def search(
    q: str,
    project_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    results = search_service.search(db, current_user.id, q, project_id)
    return {"results": results}