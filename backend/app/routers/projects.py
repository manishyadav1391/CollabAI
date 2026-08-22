from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user, require_role
from app.core.exceptions import NotFoundError, ValidationError
from app.models.project import Project
from app.models.user import User
from app.repositories import project_repo, workspace_repo
from app.schemas.project import ProjectCreateRequest, ProjectResponse, ProjectPermissionRequest
from app.services import project_service

router = APIRouter()


def _require_project_admin(db: Session, project_id: str, current_user: User) -> Project:
    """Same manual-lookup pattern as set_permissions below — project routes
    are keyed by project_id, not workspace_id, so require_role() can't be
    used directly."""
    project = project_repo.get_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    membership = workspace_repo.get_membership(db, project.workspace_id, current_user.id)
    if not membership or membership.role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Insufficient role")
    return project


@router.post("/workspaces/{workspace_id}/projects", response_model=ProjectResponse)
def create_project(
    workspace_id: str,
    payload: ProjectCreateRequest,
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    return project_service.create_project(db, workspace_id, payload.name, payload.visibility)


@router.get("/workspaces/{workspace_id}/projects", response_model=list[ProjectResponse])
def list_projects(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_role("member")),
    db: Session = Depends(get_db),
):
    return project_service.list_projects(db, workspace_id, current_user.id)


@router.put("/projects/{project_id}/permissions")
def set_permissions(
    project_id: str,
    payload: ProjectPermissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # NOTE: this route doesn't have workspace_id as a path param, so it
    # can't use the standard require_role() dependency directly — we look
    # up the project's workspace and check the role manually instead.
    # This is a temporary pattern; docs/05-security-compliance.md §4.2
    # wants all role checks centralized — revisit this in Phase 8 hardening.
    project = project_repo.get_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    membership = workspace_repo.get_membership(db, project.workspace_id, current_user.id)
    if not membership or membership.role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Insufficient role")

    project_service.set_project_permissions(db, project_id, payload.user_ids, current_user.id)
    return {"status": "permissions updated"}


@router.get("/workspaces/{workspace_id}/projects/trash", response_model=list[ProjectResponse])
def list_trash(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    return project_service.list_deleted_projects(db, workspace_id)


@router.delete("/projects/{project_id}")
def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_project_admin(db, project_id, current_user)
    try:
        project_service.delete_project(db, project_id, current_user.id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"status": "Project moved to trash. It can be restored within 30 days."}


@router.post("/projects/{project_id}/restore")
def restore_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_project_admin(db, project_id, current_user)
    try:
        project_service.restore_project(db, project_id, current_user.id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"status": "Project restored"}