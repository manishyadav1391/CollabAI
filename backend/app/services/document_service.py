import uuid
from sqlalchemy.orm import Session

from app.core import storage
from app.repositories import document_repo
from app.services import processing_service
from app.core.permission_filter import can_access_project
from app.core.exceptions import PermissionDeniedError


def create_upload_session(db: Session, project_id: str, folder_id: str | None,
                           filename: str, mime_type: str, size_bytes: int, user_id) -> dict:
    document = document_repo.create_document(db, project_id, folder_id, user_id)
    object_key = f"{project_id}/{document.id}/{uuid.uuid4()}_{filename}"
    version = document_repo.create_version(db, document.id, object_key, filename, mime_type, size_bytes)
    document_repo.set_current_version(db, document.id, version.id)

    return {
        "upload_url": storage.generate_upload_url(object_key),
        "document_id": str(document.id),
        "version_id": str(version.id),
        "object_storage_key": object_key,
    }


def confirm_upload(db: Session, document_id: str, version_id: str):
    document_repo.mark_version_status(db, version_id, "processing")
    processing_service.enqueue_processing(db, document_id, version_id)
    return document_repo.get_by_id(db, document_id)


def get_download_url(db: Session, document_id: str, user_id) -> str:
    document = document_repo.get_by_id(db, document_id)
    if not document or not can_access_project(db, user_id, str(document.project_id)):
        raise PermissionDeniedError("No access to this document")

    version = document_repo.get_version(db, document.current_version_id)
    return storage.generate_download_url(version.object_storage_key)


def list_documents(db: Session, project_id: str, user_id) -> list[dict]:
    if not can_access_project(db, user_id, project_id):
        raise PermissionDeniedError("No access to this project")

    docs = document_repo.list_by_project(db, project_id)
    result = []
    for d in docs:
        version = document_repo.get_version(db, d.current_version_id)
        result.append({
            "id": str(d.id),
            "project_id": str(d.project_id),
            "folder_id": str(d.folder_id) if d.folder_id else None,
            "restricted": d.restricted,
            "created_by": str(d.created_by),
            "current_version": version,
        })
    return result


def delete_document(db: Session, document_id: str) -> None:
    document_repo.soft_delete(db, document_id)