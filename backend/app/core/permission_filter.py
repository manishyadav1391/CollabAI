"""
THE shared permission-filtering function.

Every code path that reads documents, runs search, or retrieves context
for the AI Copilot imports from here — never a second implementation.
See docs/05-security-compliance.md §5 for why: filtering must happen
BEFORE data is fetched, not after, or restricted content can leak via
logs, error payloads, or (in Phase 5) the LLM prompt itself.

v1 scope: filters at the PROJECT level (workspace membership +
ProjectPermission) via `permission_filtered_project_ids`/`can_access_project`,
AND at the DOCUMENT level (the `restricted` flag + DocumentPermission) via
`can_access_document`. A restricted document is visible only to its
uploader and users with an explicit DocumentPermission row, even if they
can otherwise see the project it lives in.
"""

from sqlalchemy.orm import Session

from app.models.workspace_member import WorkspaceMember
from app.models.project import Project
from app.models.project_permission import ProjectPermission


def permission_filtered_project_ids(db: Session, user_id) -> list:
    """
    Returns every project ID this user is allowed to see:
      - workspace_wide projects in any workspace they're a member of, PLUS
      - restricted projects where they have an explicit ProjectPermission row.

    This is the ONLY function that should ever answer "what can this user
    see" for search (Phase 4) and AI retrieval (Phase 5).
    """
    workspace_ids = [
        row.workspace_id
        for row in db.query(WorkspaceMember).filter(WorkspaceMember.user_id == user_id).all()
    ]
    if not workspace_ids:
        return []

    workspace_wide_ids = [
        row.id
        for row in db.query(Project)
        .filter(
            Project.workspace_id.in_(workspace_ids),
            Project.visibility == "workspace_wide",
            Project.deleted_at.is_(None),
        )
        .all()
    ]

    restricted_permitted_ids = [
        row.id
        for row in db.query(Project)
        .join(ProjectPermission, ProjectPermission.project_id == Project.id)
        .filter(
            Project.workspace_id.in_(workspace_ids),
            Project.visibility == "restricted",
            Project.deleted_at.is_(None),
            ProjectPermission.user_id == user_id,
        )
        .all()
    ]

    return list(set(workspace_wide_ids + restricted_permitted_ids))


def can_access_project(db: Session, user_id, project_id) -> bool:
    allowed_ids = {str(pid) for pid in permission_filtered_project_ids(db, user_id)}
    return str(project_id) in allowed_ids


def can_access_document(db: Session, user_id, document) -> bool:
    """document is a Document ORM instance (or anything with .project_id,
    .restricted, .created_by, .id)."""
    if not can_access_project(db, user_id, str(document.project_id)):
        return False
    if not document.restricted:
        return True
    if str(document.created_by) == str(user_id):
        return True

    from app.repositories import document_permission_repo
    return document_permission_repo.has_permission(db, str(document.id), user_id)