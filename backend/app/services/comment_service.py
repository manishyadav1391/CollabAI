import re

from sqlalchemy.orm import Session

from app.core.exceptions import PermissionDeniedError, NotFoundError
from app.core.permission_filter import can_access_project
from app.repositories import comment_repo, document_repo
from app.services import notification_service

_MENTION_RE = re.compile(r"@([\w][\w' -]*)")


def _extract_mentioned_user_ids(db: Session, content: str, workspace_id, exclude_user_id) -> list:
    """Matches `@Full Name` tokens in the comment against this workspace's
    members. Simple substring match against `@name` — no dedicated
    mention-picker UI in v1, so this is what "mention" means here."""
    from app.models.user import User
    from app.models.workspace_member import WorkspaceMember

    handles = {m.group(1).strip().lower() for m in _MENTION_RE.finditer(content)}
    if not handles:
        return []

    members = (
        db.query(User)
        .join(WorkspaceMember, WorkspaceMember.user_id == User.id)
        .filter(WorkspaceMember.workspace_id == workspace_id)
        .all()
    )

    mentioned_ids = []
    for user in members:
        if str(user.id) == str(exclude_user_id):
            continue
        name = user.name.strip().lower()
        if any(handle == name or handle.startswith(name) for handle in handles):
            mentioned_ids.append(user.id)
    return mentioned_ids


def add_comment(db: Session, document_id: str, author_id, content: str, parent_comment_id: str | None = None):
    document = document_repo.get_by_id(db, document_id)
    if not document or not can_access_project(db, author_id, str(document.project_id)):
        raise PermissionDeniedError("No access to this document")

    comment = comment_repo.create(db, document_id, author_id, content, parent_comment_id)

    from app.models.project import Project
    project = db.query(Project).filter(Project.id == document.project_id).first()
    if project:
        for mentioned_id in _extract_mentioned_user_ids(db, content, project.workspace_id, author_id):
            notification_service.enqueue_notification(mentioned_id, "mention", {
                "document_id": str(document_id),
                "comment_id": str(comment.id),
                "project_id": str(document.project_id),
                "workspace_id": str(project.workspace_id),
            })

    return comment


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


def _get_document_for_comment(db: Session, comment_id: str, user_id):
    comment = comment_repo.get_by_id(db, comment_id)
    if not comment:
        raise NotFoundError("Comment not found")
    document = document_repo.get_by_id(db, str(comment.document_id))
    if not document or not can_access_project(db, user_id, str(document.project_id)):
        raise PermissionDeniedError("No access to this document")
    return comment, document


def _require_document_access_for_comment(db: Session, comment_id: str, user_id):
    _get_document_for_comment(db, comment_id, user_id)


def resolve_comment(db: Session, comment_id: str, user_id):
    _require_document_access_for_comment(db, comment_id, user_id)
    comment_repo.set_status(db, comment_id, "resolved")


def reopen_comment(db: Session, comment_id: str, user_id):
    _require_document_access_for_comment(db, comment_id, user_id)
    comment_repo.set_status(db, comment_id, "open")


def delete_comment(db: Session, comment_id: str, user_id):
    # can_access_project (via _get_document_for_comment) is the same gate
    # add_comment/list_comments/resolve_comment/reopen_comment use — this
    # used to be a separate ad-hoc role lookup done in the router, which
    # skipped that check entirely (an admin/owner could delete a comment
    # in a restricted project they'd otherwise been shut out of).
    comment, document = _get_document_for_comment(db, comment_id, user_id)

    from app.models.project import Project
    from app.models.workspace_member import WorkspaceMember

    project = db.query(Project).filter(Project.id == document.project_id).first()
    membership = (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == project.workspace_id, WorkspaceMember.user_id == user_id)
        .first()
        if project else None
    )
    role = membership.role if membership else "member"

    is_author = str(comment.author_id) == str(user_id)
    is_admin_or_owner = role in ("admin", "owner")

    if not (is_author or is_admin_or_owner):
        raise PermissionDeniedError("Only the author or an admin/owner can delete this comment")

    comment_repo.delete(db, comment_id)