from sqlalchemy.orm import Session
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.models.invite import Invite


def create_workspace(db: Session, name: str, owner_id: str) -> Workspace:
    ws = Workspace(name=name, owner_id=owner_id)
    db.add(ws)
    db.commit()
    db.refresh(ws)
    return ws


def add_member(db: Session, workspace_id: str, user_id: str, role: str) -> WorkspaceMember:
    member = WorkspaceMember(workspace_id=workspace_id, user_id=user_id, role=role)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def get_membership(db: Session, workspace_id: str, user_id: str) -> WorkspaceMember | None:
    return (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.user_id == user_id)
        .first()
    )


def list_members(db: Session, workspace_id: str) -> list[WorkspaceMember]:
    return db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace_id).all()


def list_workspaces_for_user(db: Session, user_id: str) -> list[Workspace]:
    return (
        db.query(Workspace)
        .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .filter(WorkspaceMember.user_id == user_id, Workspace.deleted_at.is_(None))
        .all()
    )


def create_invite(db: Session, workspace_id: str, email: str, role: str, token: str, expires_at) -> Invite:
    invite = Invite(
        workspace_id=workspace_id, email=email, invited_role=role,
        token=token, expires_at=expires_at,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite


def get_invite_by_token(db: Session, token: str) -> Invite | None:
    return db.query(Invite).filter(Invite.token == token).first()


def remove_member(db: Session, workspace_id: str, user_id: str) -> None:
    db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id,
    ).delete()
    db.commit()

def get_by_id(db: Session, workspace_id: str):
    return db.query(Workspace).filter(Workspace.id == workspace_id).first()    