from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user
from app.core.exceptions import PermissionDeniedError, NotFoundError, ValidationError
from app.models.user import User
from app.schemas.folder import FolderCreateRequest, FolderResponse
from app.services import folder_service

router = APIRouter()


@router.post("", response_model=FolderResponse)
def create_folder(
    payload: FolderCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return folder_service.create_folder(
            db, payload.project_id, payload.parent_folder_id, payload.name, current_user.id
        )
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("", response_model=list[FolderResponse])
def list_folders(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return folder_service.list_folders(db, project_id, current_user.id)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.delete("/{folder_id}")
def delete_folder(
    folder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        folder_service.delete_folder(db, folder_id, current_user.id)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"status": "deleted"}
