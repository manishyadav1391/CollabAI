import uuid
from sqlalchemy.orm import Session

from app.core import storage
from app.repositories import document_repo, document_permission_repo
from app.services import processing_service, notification_service
from app.core.permission_filter import can_access_project, can_access_document
from app.core.exceptions import PermissionDeniedError, NotFoundError, ValidationError

# Suggested part size for chunked/resumable uploads (FR-DOC-05) — comfortably
# above S3/MinIO's 5MB minimum for a non-final part.
MULTIPART_PART_SIZE_BYTES = 8 * 1024 * 1024


def _resolve_upload_target(db: Session, project_id: str, folder_id: str | None, user_id, document_id: str | None):
    """Either the existing document a new version is being added to
    (FR-DOC-07 re-upload), or a freshly created one."""
    if document_id:
        document = document_repo.get_by_id(db, document_id)
        if not document or str(document.project_id) != str(project_id) or document.deleted_at is not None:
            raise NotFoundError("Document not found in this project")
        return document

    if folder_id:
        from app.repositories import folder_repo
        folder = folder_repo.get_by_id(db, folder_id)
        if not folder or str(folder.project_id) != str(project_id):
            raise NotFoundError("Folder not found in this project")

    return document_repo.create_document(db, project_id, folder_id, user_id)


def create_upload_session(db: Session, project_id: str, folder_id: str | None,
                           filename: str, mime_type: str, size_bytes: int, user_id,
                           document_id: str | None = None) -> dict:
    if not can_access_project(db, user_id, project_id):
        raise PermissionDeniedError("No access to this project")

    document = _resolve_upload_target(db, project_id, folder_id, user_id, document_id)
    object_key = f"{project_id}/{document.id}/{uuid.uuid4()}_{filename}"
    version = document_repo.create_version(db, document.id, object_key, filename, mime_type, size_bytes)
    document_repo.set_current_version(db, document.id, version.id)

    return {
        "upload_url": storage.generate_upload_url(object_key),
        "document_id": str(document.id),
        "version_id": str(version.id),
        "object_storage_key": object_key,
    }


def create_multipart_upload_session(db: Session, project_id: str, folder_id: str | None,
                                     filename: str, mime_type: str, size_bytes: int, user_id,
                                     document_id: str | None = None) -> dict:
    """Same as create_upload_session, but for files split into parts on the
    client (FR-DOC-05) — used for uploads too large/unreliable for a single
    presigned PUT."""
    if not can_access_project(db, user_id, project_id):
        raise PermissionDeniedError("No access to this project")

    document = _resolve_upload_target(db, project_id, folder_id, user_id, document_id)
    object_key = f"{project_id}/{document.id}/{uuid.uuid4()}_{filename}"
    version = document_repo.create_version(db, document.id, object_key, filename, mime_type, size_bytes)
    document_repo.set_current_version(db, document.id, version.id)

    upload_id = storage.create_multipart_upload(object_key)
    document_repo.set_multipart_upload_id(db, version.id, upload_id)

    total_parts = max(1, -(-size_bytes // MULTIPART_PART_SIZE_BYTES))  # ceil division

    return {
        "document_id": str(document.id),
        "version_id": str(version.id),
        "upload_id": upload_id,
        "object_storage_key": object_key,
        "part_size_bytes": MULTIPART_PART_SIZE_BYTES,
        "total_parts": total_parts,
    }


def _get_multipart_version(db: Session, document_id: str, version_id: str, user_id):
    document = document_repo.get_by_id(db, document_id)
    if not document or not can_access_project(db, user_id, str(document.project_id)):
        raise PermissionDeniedError("No access to this document")
    version = document_repo.get_version(db, version_id)
    if not version or str(version.document_id) != str(document_id):
        raise NotFoundError("Version not found for this document")
    if not version.multipart_upload_id:
        raise ValidationError("This upload is not a multipart upload, or it has already been completed")
    return document, version


def get_multipart_part_url(db: Session, document_id: str, version_id: str, part_number: int, user_id) -> str:
    if not (1 <= part_number <= 10000):
        raise ValidationError("part_number must be between 1 and 10000")
    _, version = _get_multipart_version(db, document_id, version_id, user_id)
    return storage.generate_part_upload_url(version.object_storage_key, version.multipart_upload_id, part_number)


def list_multipart_parts(db: Session, document_id: str, version_id: str, user_id) -> list[dict]:
    """Lets a client resume after a reload/crash — ask MinIO which parts
    already landed instead of trusting client-side state alone."""
    _, version = _get_multipart_version(db, document_id, version_id, user_id)
    return storage.list_uploaded_parts(version.object_storage_key, version.multipart_upload_id)


def complete_multipart_upload(db: Session, document_id: str, version_id: str, parts: list[dict], user_id) -> None:
    _, version = _get_multipart_version(db, document_id, version_id, user_id)
    storage.complete_multipart_upload(version.object_storage_key, version.multipart_upload_id, parts)
    document_repo.set_multipart_upload_id(db, version_id, None)
    confirm_upload(db, document_id, version_id, user_id)


def abort_multipart_upload(db: Session, document_id: str, version_id: str, user_id) -> None:
    _, version = _get_multipart_version(db, document_id, version_id, user_id)
    storage.abort_multipart_upload(version.object_storage_key, version.multipart_upload_id)
    document_repo.set_multipart_upload_id(db, version_id, None)
    document_repo.mark_version_status(db, version_id, "aborted")


def confirm_upload(db: Session, document_id: str, version_id: str, user_id):
    document = document_repo.get_by_id(db, document_id)
    if not document or not can_access_project(db, user_id, str(document.project_id)):
        raise PermissionDeniedError("No access to this document")
    version = document_repo.get_version(db, version_id)
    if not version or str(version.document_id) != str(document_id):
        raise NotFoundError("Version not found for this document")

    document_repo.mark_version_status(db, version_id, "processing")
    processing_service.enqueue_processing(db, document_id, version_id)
    _notify_project_members_of_upload(db, document, version)
    return document


def _notify_project_members_of_upload(db: Session, document, version) -> None:
    from app.models.project import Project
    from app.models.workspace_member import WorkspaceMember

    project = db.query(Project).filter(Project.id == document.project_id).first()
    if not project:
        return

    member_ids = [
        row.user_id
        for row in db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == project.workspace_id).all()
        if str(row.user_id) != str(document.created_by)
    ]
    for member_id in member_ids:
        if not can_access_project(db, member_id, str(document.project_id)):
            continue
        notification_service.enqueue_notification(member_id, "upload", {
            "document_id": str(document.id),
            "project_id": str(document.project_id),
            "workspace_id": str(project.workspace_id),
            "filename": version.filename if version else None,
        })


def get_download_url(db: Session, document_id: str, user_id) -> str:
    document = document_repo.get_by_id(db, document_id)
    if not document or not can_access_document(db, user_id, document):
        raise PermissionDeniedError("No access to this document")

    version = document_repo.get_version(db, document.current_version_id)
    return storage.generate_download_url(version.object_storage_key)


def list_document_versions(db: Session, document_id: str, user_id) -> list[dict]:
    document = document_repo.get_by_id(db, document_id)
    if not document or not can_access_document(db, user_id, document):
        raise PermissionDeniedError("No access to this document")

    return [
        {
            "id": str(v.id),
            "filename": v.filename,
            "mime_type": v.mime_type,
            "size_bytes": v.size_bytes,
            "status": v.status,
            "failure_reason": v.failure_reason,
            "uploaded_at": v.uploaded_at,
            "is_current": str(v.id) == str(document.current_version_id),
        }
        for v in document_repo.list_versions(db, document_id)
    ]


def restore_document_version(db: Session, document_id: str, version_id: str, user_id) -> None:
    document = document_repo.get_by_id(db, document_id)
    if not document:
        raise NotFoundError("Document not found")
    if not can_access_document(db, user_id, document):
        raise PermissionDeniedError("No access to this document")

    version = document_repo.get_version(db, version_id)
    if not version or str(version.document_id) != str(document_id):
        raise NotFoundError("Version not found for this document")
    if version.status != "ready":
        raise ValidationError("Only a successfully processed version can be restored")

    document_repo.set_current_version(db, document_id, version_id)


def list_documents(db: Session, project_id: str, user_id) -> list[dict]:
    if not can_access_project(db, user_id, project_id):
        raise PermissionDeniedError("No access to this project")

    docs = document_repo.list_by_project(db, project_id)
    result = []
    for d in docs:
        if not can_access_document(db, user_id, d):
            continue
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


def set_document_permissions(db: Session, document_id: str, restricted: bool, user_ids: list[str], actor_id) -> None:
    document = document_repo.get_by_id(db, document_id)
    if not document:
        raise NotFoundError("Document not found")

    from app.models.project import Project
    from app.models.workspace_member import WorkspaceMember

    project = db.query(Project).filter(Project.id == document.project_id).first()
    membership = (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == project.workspace_id, WorkspaceMember.user_id == actor_id)
        .first()
    )
    role = membership.role if membership else "member"
    if role not in ("admin", "owner"):
        raise PermissionDeniedError("Only an admin/owner can change document access")

    document.restricted = restricted
    db.commit()
    document_permission_repo.set_permissions(db, document_id, user_ids if restricted else [])


def get_document_permissions(db: Session, document_id: str, user_id) -> dict:
    document = document_repo.get_by_id(db, document_id)
    if not document or not can_access_document(db, user_id, document):
        raise PermissionDeniedError("No access to this document")

    return {
        "restricted": document.restricted,
        "user_ids": document_permission_repo.get_permitted_user_ids(db, document_id),
    }


def delete_document(db: Session, document_id: str, user_id) -> None:
    document = document_repo.get_by_id(db, document_id)
    if not document:
        raise NotFoundError("Document not found")
    if not can_access_project(db, user_id, str(document.project_id)):
        raise PermissionDeniedError("No access to this document")

    from app.models.project import Project
    from app.models.workspace_member import WorkspaceMember

    project = db.query(Project).filter(Project.id == document.project_id).first()
    membership = (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == project.workspace_id, WorkspaceMember.user_id == user_id)
        .first()
    )
    role = membership.role if membership else "member"
    is_uploader = str(document.created_by) == str(user_id)

    if not (is_uploader or role in ("admin", "owner")):
        raise PermissionDeniedError("Only the uploader or an admin/owner can delete this document")

    document_repo.soft_delete(db, document_id)