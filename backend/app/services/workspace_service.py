import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, PermissionDeniedError, ValidationError
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


def _check_invite_usable(invite):
    if invite is None:
        raise NotFoundError("Invite not found")
    if invite.accepted_at is not None:
        raise ValidationError("This invite has already been used")
    if invite.expires_at < datetime.now(timezone.utc):
        raise ValidationError("This invite has expired")


def get_invite_preview(db: Session, token: str) -> dict:
    invite = workspace_repo.get_invite_by_token(db, token)
    _check_invite_usable(invite)
    workspace = workspace_repo.get_by_id(db, invite.workspace_id)
    return {
        "workspace_id": invite.workspace_id,
        "workspace_name": workspace.name if workspace else "",
        "email": invite.email,
        "role": invite.invited_role,
    }


def accept_invite(db: Session, token: str, current_user) -> dict:
    invite = workspace_repo.get_invite_by_token(db, token)
    _check_invite_usable(invite)
    if invite.email.lower() != current_user.email.lower():
        raise PermissionDeniedError("This invite was sent to a different email address")

    if not workspace_repo.get_membership(db, invite.workspace_id, current_user.id):
        workspace_repo.add_member(db, invite.workspace_id, current_user.id, invite.invited_role)
    invite.accepted_at = datetime.now(timezone.utc)
    db.commit()

    workspace = workspace_repo.get_by_id(db, invite.workspace_id)
    return {"workspace_id": invite.workspace_id, "workspace_name": workspace.name if workspace else ""}


def list_members(db: Session, workspace_id: str):
    members = workspace_repo.list_members(db, workspace_id)
    result = []
    for m in members:
        user = user_repo.get_by_id(db, m.user_id)
        result.append({"user_id": str(m.user_id), "email": user.email, "name": user.name, "role": m.role})
    return result


async def list_online_members(db: Session, workspace_id: str) -> list[str]:
    """FR-CHAT-04 — which of this workspace's members currently have a live
    `/ws/notifications` connection (see app/core/presence.py)."""
    from app.core import presence
    member_user_ids = [str(m.user_id) for m in workspace_repo.list_members(db, workspace_id)]
    online = await presence.get_online_user_ids(member_user_ids)
    return sorted(online)


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


def transfer_ownership(db: Session, workspace_id: str, new_owner_id: str, actor_id):
    ws = workspace_repo.get_by_id(db, workspace_id)
    if not ws:
        raise NotFoundError("Workspace not found")
    if str(ws.owner_id) != str(actor_id):
        raise PermissionDeniedError("Only the Owner can transfer ownership")
    if str(new_owner_id) == str(actor_id):
        raise ValidationError("Already the owner")

    new_owner_membership = workspace_repo.get_membership(db, workspace_id, new_owner_id)
    if not new_owner_membership:
        raise NotFoundError("Member not found")

    old_owner_membership = workspace_repo.get_membership(db, workspace_id, actor_id)
    old_owner_membership.role = "admin"
    new_owner_membership.role = "owner"
    ws.owner_id = new_owner_id
    db.commit()
    log_action(db, actor_id, "ownership_transferred", "workspace", workspace_id,
               {"new_owner_id": str(new_owner_id)})


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



