from sqlalchemy.orm import Session

from app.models.document_permission import DocumentPermission


def set_permissions(db: Session, document_id: str, user_ids: list[str]) -> None:
    db.query(DocumentPermission).filter(DocumentPermission.document_id == document_id).delete()
    for user_id in set(user_ids):
        db.add(DocumentPermission(document_id=document_id, user_id=user_id))
    db.commit()


def get_permitted_user_ids(db: Session, document_id: str) -> list[str]:
    rows = db.query(DocumentPermission).filter(DocumentPermission.document_id == document_id).all()
    return [str(r.user_id) for r in rows]


def has_permission(db: Session, document_id: str, user_id) -> bool:
    return (
        db.query(DocumentPermission)
        .filter(DocumentPermission.document_id == document_id, DocumentPermission.user_id == user_id)
        .first()
        is not None
    )
