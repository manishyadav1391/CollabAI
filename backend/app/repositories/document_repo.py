from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.document_version import DocumentVersion


def create_document(db: Session, project_id: str, folder_id: str | None, created_by) -> Document:
    doc = Document(project_id=project_id, folder_id=folder_id, created_by=created_by)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def create_version(db: Session, document_id: str, object_storage_key: str, filename: str,
                    mime_type: str, size_bytes: int) -> DocumentVersion:
    version = DocumentVersion(
        document_id=document_id, object_storage_key=object_storage_key,
        filename=filename, mime_type=mime_type, size_bytes=size_bytes, status="pending",
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version


def set_current_version(db: Session, document_id: str, version_id: str) -> None:
    doc = db.query(Document).filter(Document.id == document_id).first()
    doc.current_version_id = version_id
    db.commit()


def mark_version_status(db: Session, version_id: str, status: str, failure_reason: str | None = None) -> None:
    version = db.query(DocumentVersion).filter(DocumentVersion.id == version_id).first()
    version.status = status
    version.failure_reason = failure_reason
    db.commit()


def get_by_id(db: Session, document_id: str) -> Document | None:
    return db.query(Document).filter(Document.id == document_id).first()


def get_version(db: Session, version_id: str) -> DocumentVersion | None:
    if not version_id:
        return None
    return db.query(DocumentVersion).filter(DocumentVersion.id == version_id).first()


def list_by_project(db: Session, project_id: str) -> list[Document]:
    return (
        db.query(Document)
        .filter(Document.project_id == project_id, Document.deleted_at.is_(None))
        .all()
    )


def soft_delete(db: Session, document_id: str) -> None:
    doc = db.query(Document).filter(Document.id == document_id).first()
    doc.deleted_at = datetime.now(timezone.utc)
    db.commit()