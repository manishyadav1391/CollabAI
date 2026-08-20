from sqlalchemy.orm import Session
from app.repositories import project_repo
from app.core.audit import log_action

def create_project(db: Session, workspace_id: str, name: str, visibility: str):
    return project_repo.create_project(db, workspace_id, name, visibility)


def list_projects(db: Session, workspace_id: str):
    return project_repo.list_projects(db, workspace_id)


def set_project_permissions(db: Session, project_id: str, user_ids: list[str]):
    project_repo.set_permissions(db, project_id, user_ids)

def set_project_permissions(db: Session, project_id: str, user_ids: list[str], actor_id):
    project_repo.set_permissions(db, project_id, user_ids)
    log_action(db, actor_id, "project_permissions_changed", "project", project_id, {"user_ids": user_ids})    