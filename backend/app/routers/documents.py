from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.document import (
    UploadUrlRequest, UploadUrlResponse, UploadCompleteRequest, DocumentResponse,
)
from app.services import document_service

router = APIRouter()


@router.post("/upload-url", response_model=UploadUrlResponse)
def get_upload_url(
    payload: UploadUrlRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return document_service.create_upload_session(
        db, payload.project_id, payload.folder_id, payload.filename,
        payload.mime_type, payload.size_bytes, current_user.id,
    )


@router.post("/upload-complete")
def confirm_upload(
    payload: UploadCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document_service.confirm_upload(db, payload.document_id, payload.version_id)
    return {"status": "confirmed"}


@router.get("", response_model=list[DocumentResponse])
def list_documents(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return document_service.list_documents(db, project_id)


@router.get("/{document_id}/download-url")
def get_download_url(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {"download_url": document_service.get_download_url(db, document_id)}


@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document_service.delete_document(db, document_id)
    return {"status": "deleted"}