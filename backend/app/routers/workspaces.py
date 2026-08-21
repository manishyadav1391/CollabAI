from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user, require_role
from app.core.exceptions import NotFoundError, PermissionDeniedError, ValidationError
from app.models.user import User
from app.schemas.workspace import (
    WorkspaceCreateRequest, WorkspaceResponse, InviteRequest, RoleChangeRequest, MemberResponse,
    InvitePreviewResponse, AcceptInviteResponse,
)
from app.services import workspace_service

router = APIRouter()


@router.post("", response_model=WorkspaceResponse)
def create_workspace(
    payload: WorkspaceCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return workspace_service.create_workspace(db, payload.name, current_user.id)


@router.get("", response_model=list[WorkspaceResponse])
def list_my_workspaces(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return workspace_service.list_my_workspaces(db, current_user.id)


@router.post("/{workspace_id}/invites")
def invite_member(
    workspace_id: str,
    payload: InviteRequest,
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    invite = workspace_service.invite_member(db, workspace_id, payload.email, payload.role)
    return {"invite_id": str(invite.id), "token": invite.token}


@router.get("/invites/{token}", response_model=InvitePreviewResponse)
def preview_invite(token: str, db: Session = Depends(get_db)):
    try:
        return workspace_service.get_invite_preview(db, token)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=410, detail=str(e))


@router.post("/invites/{token}/accept", response_model=AcceptInviteResponse)
def accept_invite(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return workspace_service.accept_invite(db, token, current_user)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=410, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/{workspace_id}/members", response_model=list[MemberResponse])
def list_members(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return workspace_service.list_members(db, workspace_id)


@router.post("/{workspace_id}/members/{user_id}/role")
def change_role(
    workspace_id: str, user_id: str, payload: RoleChangeRequest,
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    try:
        workspace_service.change_role(db, workspace_id, user_id, payload.role, current_user.id)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"status": "role updated"}



@router.delete("/{workspace_id}/members/{user_id}")
def remove_member(
    workspace_id: str, user_id: str,
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    try:
        workspace_service.remove_member(db, workspace_id, user_id, current_user.id)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    return {"status": "member removed"}



@router.delete("/{workspace_id}")
def delete_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        workspace_service.delete_workspace(db, workspace_id, current_user.id)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"status": "workspace deleted"}    