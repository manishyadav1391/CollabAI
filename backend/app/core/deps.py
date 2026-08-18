"""
FastAPI dependency functions: current user extraction, role enforcement.
Every protected route uses these — never an inline role check
(docs/05-security-compliance.md §4.2).
"""

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.models.workspace_member import WorkspaceMember

ROLE_RANK = {"member": 0, "admin": 1, "owner": 2}


def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.removeprefix("Bearer ").strip()
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def require_role(min_role: str):
    """
    Returns a FastAPI dependency that checks the current user has at
    least `min_role` in the workspace identified by the route's
    `workspace_id` path parameter.

    Usage:
        @router.post("/{workspace_id}/invites")
        def invite(
            workspace_id: str,
            _: None = Depends(require_role("admin")),
        ):
            ...
    """

    def dependency(
        workspace_id: str,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> None:
        membership = (
            db.query(WorkspaceMember)
            .filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == current_user.id,
            )
            .first()
        )
        if not membership:
            raise HTTPException(status_code=403, detail="Not a member of this workspace")

        if ROLE_RANK.get(membership.role, -1) < ROLE_RANK.get(min_role, 99):
            raise HTTPException(status_code=403, detail="Insufficient role")

    return dependency