from sqlalchemy.orm import Session
from app.models.comment import Comment


def create(db: Session, document_id: str, author_id, content: str, parent_comment_id: str | None) -> Comment:
    comment = Comment(
        document_id=document_id, author_id=author_id,
        content=content, parent_comment_id=parent_comment_id,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


def list_for_document(db: Session, document_id: str) -> list[Comment]:
    return (
        db.query(Comment)
        .filter(Comment.document_id == document_id)
        .order_by(Comment.created_at.asc())
        .all()
    )


def get_by_id(db: Session, comment_id: str) -> Comment | None:
    return db.query(Comment).filter(Comment.id == comment_id).first()


def set_status(db: Session, comment_id: str, status: str) -> None:
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    comment.status = status
    db.commit()


def delete(db: Session, comment_id: str) -> None:
    db.query(Comment).filter(Comment.id == comment_id).delete()
    db.commit()