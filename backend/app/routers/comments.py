from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user
from app.core.exceptions import PermissionDeniedError, NotFoundError
from app.models.user import User
from app.schemas.comment import CommentCreateRequest, CommentResponse
from app.services import comment_service

router = APIRouter()


@router.post("/documents/{document_id}/comments", response_model=CommentResponse)
def add_comment(
    document_id: str,
    payload: CommentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return comment_service.add_comment(
            db, document_id, current_user.id, payload.content, payload.parent_comment_id
        )
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/documents/{document_id}/comments", response_model=list[CommentResponse])
def list_comments(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return comment_service.list_comments(db, document_id, current_user.id)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.put("/comments/{comment_id}/resolve")
def resolve_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        comment_service.resolve_comment(db, comment_id, current_user.id)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"status": "resolved"}


@router.put("/comments/{comment_id}/reopen")
def reopen_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        comment_service.reopen_comment(db, comment_id, current_user.id)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"status": "reopened"}


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        comment_service.delete_comment(db, comment_id, current_user.id)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"status": "deleted"}