"""
SEC-T-04 (docs/05-security-compliance.md §5.4):
A user who loses project access immediately loses search/AI/direct
access on their next request.
"""

import uuid

from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.models.project import Project
from app.models.project_permission import ProjectPermission
from app.core.security import hash_password


def test_sec_t_04_revoked_access_takes_effect_immediately(client, db):
    unique = uuid.uuid4().hex[:8]

    owner = User(email=f"owner_{unique}@test.com", password_hash=hash_password("password123"), name="Owner")
    member = User(email=f"member_{unique}@test.com", password_hash=hash_password("password123"), name="Member")
    db.add_all([owner, member])
    db.commit()

    workspace = Workspace(name=f"WS {unique}", owner_id=owner.id)
    db.add(workspace)
    db.commit()

    db.add_all([
        WorkspaceMember(workspace_id=workspace.id, user_id=owner.id, role="owner"),
        WorkspaceMember(workspace_id=workspace.id, user_id=member.id, role="member"),
    ])
    db.commit()

    project = Project(workspace_id=workspace.id, name="Restricted", visibility="restricted")
    db.add(project)
    db.commit()

    permission = ProjectPermission(project_id=project.id, user_id=member.id)
    db.add(permission)
    db.commit()

    try:
        login_resp = client.post("/auth/login", json={"email": member.email, "password": "password123"})
        access_token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}

        # Before revocation: access should be allowed.
        before = client.get("/documents", params={"project_id": str(project.id)}, headers=headers)
        assert before.status_code == 200

        # Revoke access.
        db.query(ProjectPermission).filter(ProjectPermission.id == permission.id).delete()
        db.commit()

        # Same access token, same request — should now be denied.
        after = client.get("/documents", params={"project_id": str(project.id)}, headers=headers)
        assert after.status_code == 403, (
            "SEC-T-04 FAILED: revoking a user's project permission did not "
            "take effect on their very next request."
        )

    finally:
        db.query(Project).filter(Project.id == project.id).delete()
        db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace.id).delete()
        db.query(Workspace).filter(Workspace.id == workspace.id).delete()
        from app.models.refresh_token import RefreshToken
        db.query(RefreshToken).filter(RefreshToken.user_id.in_([owner.id, member.id])).delete(synchronize_session=False)
        db.query(User).filter(User.id.in_([owner.id, member.id])).delete(synchronize_session=False)
        db.commit()