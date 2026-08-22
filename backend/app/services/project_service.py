from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundError, ValidationError
from app.repositories import project_repo
from app.core.audit import log_action
from app.core.permission_filter import permission_filtered_project_ids
from app.services import notification_service

RESTORE_WINDOW_DAYS = 30


def create_project(db: Session, workspace_id: str, name: str, visibility: str):
    return project_repo.create_project(db, workspace_id, name, visibility)


def list_projects(db: Session, workspace_id: str, user_id):
    allowed_ids = {str(p) for p in permission_filtered_project_ids(db, user_id)}
    return [p for p in project_repo.list_projects(db, workspace_id) if str(p.id) in allowed_ids]


def delete_project(db: Session, project_id: str, actor_id):
    project = project_repo.get_by_id(db, project_id)
    if not project or project.deleted_at is not None:
        raise NotFoundError("Project not found")
    project.deleted_at = datetime.now(timezone.utc)
    db.commit()
    log_action(db, actor_id, "project_deleted", "project", project_id)


def restore_project(db: Session, project_id: str, actor_id):
    project = project_repo.get_by_id(db, project_id)
    if not project or project.deleted_at is None:
        raise NotFoundError("Project not found in trash")
    if project.deleted_at < datetime.now(timezone.utc) - timedelta(days=RESTORE_WINDOW_DAYS):
        raise ValidationError("This project can no longer be restored — it's past the 30-day recovery window")
    project.deleted_at = None
    db.commit()
    log_action(db, actor_id, "project_restored", "project", project_id)


def list_deleted_projects(db: Session, workspace_id: str):
    return project_repo.list_deleted_projects(db, workspace_id)


def set_project_permissions(db: Session, project_id: str, user_ids: list[str]):
    project_repo.set_permissions(db, project_id, user_ids)

def set_project_permissions(db: Session, project_id: str, user_ids: list[str], actor_id):
    previously_permitted = set(project_repo.get_permitted_user_ids(db, project_id))
    project_repo.set_permissions(db, project_id, user_ids)
    log_action(db, actor_id, "project_permissions_changed", "project", project_id, {"user_ids": user_ids})

    newly_added = [uid for uid in user_ids if str(uid) not in previously_permitted]
    if newly_added:
        project = project_repo.get_by_id(db, project_id)
        for user_id in newly_added:
            notification_service.enqueue_notification(user_id, "added_to_project", {
                "project_id": str(project_id),
                "workspace_id": str(project.workspace_id) if project else None,
            })