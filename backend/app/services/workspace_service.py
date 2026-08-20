import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, PermissionDeniedError
from app.repositories import workspace_repo, user_repo
from app.core.audit import log_action


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

    from app.config import get_settings
    from app.services.email_service import send_email
    settings = get_settings()

    send_email(
        to=email,
        subject="You've been invited to a CollabAI workspace",
        body=f"Click the link to join: {settings.frontend_base_url}/accept-invite?token={invite.token}",
    )
    return invite


def list_members(db: Session, workspace_id: str):
    members = workspace_repo.list_members(db, workspace_id)
    result = []
    for m in members:
        user = user_repo.get_by_id(db, m.user_id)
        result.append({"user_id": str(m.user_id), "email": user.email, "name": user.name, "role": m.role})
    return result


def change_role(db: Session, workspace_id: str, target_user_id: str, new_role: str, actor_id):
    membership = workspace_repo.get_membership(db, workspace_id, target_user_id)
    if not membership:
        raise NotFoundError("Member not found")
    if membership.role == "owner":
        raise PermissionDeniedError("Cannot change the Owner's role directly")
    old_role = membership.role
    membership.role = new_role
    db.commit()
    log_action(db, actor_id, "role_changed", "workspace_member", target_user_id,
               {"workspace_id": workspace_id, "old_role": old_role, "new_role": new_role})


def remove_member(db: Session, workspace_id: str, target_user_id: str, actor_id):
    membership = workspace_repo.get_membership(db, workspace_id, target_user_id)
    if membership and membership.role == "owner":
        raise PermissionDeniedError("Cannot remove the Owner")
    workspace_repo.remove_member(db, workspace_id, target_user_id)
    log_action(db, actor_id, "member_removed", "workspace", target_user_id, {"workspace_id": workspace_id})



def delete_workspace(db: Session, workspace_id: str, actor_id):
    from datetime import datetime, timezone
    ws = workspace_repo.get_by_id(db, workspace_id)
    if not ws:
        raise NotFoundError("Workspace not found")
    if str(ws.owner_id) != str(actor_id):
        raise PermissionDeniedError("Only the Owner can delete the workspace")
    ws.deleted_at = datetime.now(timezone.utc)
    db.commit()
    log_action(db, actor_id, "workspace_deleted", "workspace", workspace_id)
    # NOTE: this is a soft delete only. Cascading deletion of associated
    # documents/MinIO objects/vector chunks (the "true forget me" from
    # docs/05-security-compliance.md §12) is a known follow-up — flag as
    # an ADR if you decide not to implement full cascade before any real
    # user relies on workspace deletion for data removal.    



