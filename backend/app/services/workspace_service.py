import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, PermissionDeniedError
from app.repositories import workspace_repo, user_repo


def create_workspace(db: Session, name: str, owner_id):
    ws = workspace_repo.create_workspace(db, name=name, owner_id=owner_id)
    workspace_repo.add_member(db, ws.id, owner_id, role="owner")
    return ws


def list_my_workspaces(db: Session, user_id):
    return workspace_repo.list_workspaces_for_user(db, user_id)


def invite_member(db: Session, workspace_id: str, email: str, role: str):
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    invite = workspace_repo.create_invite(db, workspace_id, email, role, token, expires_at)
    # Phase 1: real email sending isn't wired up yet (that's Phase 6) —
    # for now we just print the link so you can test the invite flow manually.
    print(f"[STUB EMAIL] Invite link for {email}: /accept-invite?token={invite.token}")
    return invite


def list_members(db: Session, workspace_id: str):
    members = workspace_repo.list_members(db, workspace_id)
    result = []
    for m in members:
        user = user_repo.get_by_id(db, m.user_id)
        result.append({"user_id": str(m.user_id), "email": user.email, "name": user.name, "role": m.role})
    return result


def change_role(db: Session, workspace_id: str, target_user_id: str, new_role: str):
    membership = workspace_repo.get_membership(db, workspace_id, target_user_id)
    if not membership:
        raise NotFoundError("Member not found")
    if membership.role == "owner":
        raise PermissionDeniedError("Cannot change the Owner's role directly")
    membership.role = new_role
    db.commit()


def remove_member(db: Session, workspace_id: str, target_user_id: str):
    membership = workspace_repo.get_membership(db, workspace_id, target_user_id)
    if membership and membership.role == "owner":
        raise PermissionDeniedError("Cannot remove the Owner")
    workspace_repo.remove_member(db, workspace_id, target_user_id)