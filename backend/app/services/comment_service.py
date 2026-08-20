from sqlalchemy.orm import Session

from app.core.exceptions import PermissionDeniedError, NotFoundError
from app.core.permission_filter import can_access_project
from app.repositories import comment_repo, document_repo


def add_comment(db: Session, document_id: str, author_id, content: str, parent_comment_id: str | None = None):
    document = document_repo.get_by_id(db, document_id)
    if not document or not can_access_project(db, author_id, str(document.project_id)):
        raise PermissionDeniedError("No access to this document")

    return comment_repo.create(db, document_id, author_id, content, parent_comment_id)


def list_comments(db: Session, document_id: str, user_id):
    document = document_repo.get_by_id(db, document_id)
    if not document or not can_access_project(db, user_id, str(document.project_id)):
        raise PermissionDeniedError("No access to this document")

    comments = comment_repo.list_for_document(db, document_id)
    return [
        {
            "id": str(c.id),
            "parent_comment_id": str(c.parent_comment_id) if c.parent_comment_id else None,
            "author_id": str(c.author_id),
            "content": c.content,
            "status": c.status,
            "created_at": c.created_at,
        }
        for c in comments
    ]


def resolve_comment(db: Session, comment_id: str):
    comment_repo.set_status(db, comment_id, "resolved")


def reopen_comment(db: Session, comment_id: str):
    comment_repo.set_status(db, comment_id, "open")


def delete_comment(db: Session, comment_id: str, user_id, user_role_in_workspace: str):
    comment = comment_repo.get_by_id(db, comment_id)
    if not comment:
        raise NotFoundError("Comment not found")

    is_author = str(comment.author_id) == str(user_id)
    is_admin_or_owner = user_role_in_workspace in ("admin", "owner")

    if not (is_author or is_admin_or_owner):
        raise PermissionDeniedError("Only the author or an admin/owner can delete this comment")

    comment_repo.delete(db, comment_id)