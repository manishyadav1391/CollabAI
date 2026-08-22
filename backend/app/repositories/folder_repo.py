from sqlalchemy.orm import Session

from app.models.folder import Folder
from app.models.document import Document


def create_folder(db: Session, project_id: str, parent_folder_id: str | None, name: str) -> Folder:
    folder = Folder(project_id=project_id, parent_folder_id=parent_folder_id, name=name)
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


def get_by_id(db: Session, folder_id: str) -> Folder | None:
    return db.query(Folder).filter(Folder.id == folder_id).first()


def list_by_project(db: Session, project_id: str) -> list[Folder]:
    return db.query(Folder).filter(Folder.project_id == project_id).all()


def has_children(db: Session, folder_id: str) -> bool:
    has_subfolder = db.query(Folder).filter(Folder.parent_folder_id == folder_id).first() is not None
    has_document = (
        db.query(Document)
        .filter(Document.folder_id == folder_id, Document.deleted_at.is_(None))
        .first()
        is not None
    )
    return has_subfolder or has_document


def delete(db: Session, folder_id: str) -> None:
    db.query(Folder).filter(Folder.id == folder_id).delete()
    db.commit()
