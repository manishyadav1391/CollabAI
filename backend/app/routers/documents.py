from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.document import (
    UploadUrlRequest, UploadUrlResponse, UploadCompleteRequest, DocumentResponse,
    DocumentPermissionRequest, DocumentPermissionResponse, DocumentVersionListItem,
    MultipartInitiateRequest, MultipartInitiateResponse, MultipartPartUrlRequest, MultipartPartUrlResponse,
    MultipartPartInfo, MultipartCompleteRequest, MultipartAbortRequest,
)
from app.services import document_service
from app.core.exceptions import PermissionDeniedError, NotFoundError, ValidationError

router = APIRouter()


@router.post("/upload-url", response_model=UploadUrlResponse)
def get_upload_url(
    payload: UploadUrlRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return document_service.create_upload_session(
            db, payload.project_id, payload.folder_id, payload.filename,
            payload.mime_type, payload.size_bytes, current_user.id,
            document_id=payload.document_id,
        )
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/multipart/initiate", response_model=MultipartInitiateResponse)
def initiate_multipart_upload(
    payload: MultipartInitiateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return document_service.create_multipart_upload_session(
            db, payload.project_id, payload.folder_id, payload.filename,
            payload.mime_type, payload.size_bytes, current_user.id,
            document_id=payload.document_id,
        )
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/multipart/part-url", response_model=MultipartPartUrlResponse)
def get_multipart_part_url(
    payload: MultipartPartUrlRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        url = document_service.get_multipart_part_url(
            db, payload.document_id, payload.version_id, payload.part_number, current_user.id,
        )
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"url": url}


@router.get("/multipart/{document_id}/{version_id}/parts", response_model=list[MultipartPartInfo])
def list_multipart_parts(
    document_id: str,
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return document_service.list_multipart_parts(db, document_id, version_id, current_user.id)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/multipart/complete")
def complete_multipart_upload(
    payload: MultipartCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        document_service.complete_multipart_upload(
            db, payload.document_id, payload.version_id,
            [p.model_dump() for p in payload.parts], current_user.id,
        )
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"status": "confirmed"}


@router.post("/multipart/abort")
def abort_multipart_upload(
    payload: MultipartAbortRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        document_service.abort_multipart_upload(db, payload.document_id, payload.version_id, current_user.id)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"status": "aborted"}


@router.post("/upload-complete")
def confirm_upload(
    payload: UploadCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        document_service.confirm_upload(db, payload.document_id, payload.version_id, current_user.id)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"status": "confirmed"}



@router.get("", response_model=list[DocumentResponse])
def list_documents(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return document_service.list_documents(db, project_id, current_user.id)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/{document_id}/download-url")
def get_download_url(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return {"download_url": document_service.get_download_url(db, document_id, current_user.id)}
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/{document_id}/versions", response_model=list[DocumentVersionListItem])
def list_document_versions(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return document_service.list_document_versions(db, document_id, current_user.id)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.post("/{document_id}/versions/{version_id}/restore")
def restore_document_version(
    document_id: str,
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        document_service.restore_document_version(db, document_id, version_id, current_user.id)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"status": "restored"}


@router.get("/{document_id}/permissions", response_model=DocumentPermissionResponse)
def get_document_permissions(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return document_service.get_document_permissions(db, document_id, current_user.id)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.put("/{document_id}/permissions")
def set_document_permissions(
    document_id: str,
    payload: DocumentPermissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        document_service.set_document_permissions(
            db, document_id, payload.restricted, payload.user_ids, current_user.id
        )
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"status": "permissions updated"}


@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        document_service.delete_document(db, document_id, current_user.id)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"status": "deleted"}