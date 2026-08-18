from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.repositories import project_repo, workspace_repo
from app.schemas.project import ProjectCreateRequest, ProjectResponse, ProjectPermissionRequest
from app.services import project_service

router = APIRouter()


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
    db: Session = Depends(get_db),
):
    return project_service.list_projects(db, workspace_id)


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

    project_service.set_project_permissions(db, project_id, payload.user_ids)
    return {"status": "permissions updated"}