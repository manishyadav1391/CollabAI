from sqlalchemy.orm import Session
from app.models.project import Project
from app.models.project_permission import ProjectPermission


def create_project(db: Session, workspace_id: str, name: str, visibility: str) -> Project:
    project = Project(workspace_id=workspace_id, name=name, visibility=visibility)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def list_projects(db: Session, workspace_id: str) -> list[Project]:
    return (
        db.query(Project)
        .filter(Project.workspace_id == workspace_id, Project.deleted_at.is_(None))
        .all()
    )


def get_by_id(db: Session, project_id: str) -> Project | None:
    return db.query(Project).filter(Project.id == project_id).first()


def set_permissions(db: Session, project_id: str, user_ids: list[str]) -> None:
    db.query(ProjectPermission).filter(ProjectPermission.project_id == project_id).delete()
    for uid in user_ids:
        db.add(ProjectPermission(project_id=project_id, user_id=uid))
    db.commit()