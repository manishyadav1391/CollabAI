"""
SEC-T-05 (docs/05-security-compliance.md §5.4):
Role downgrade (Admin -> Member) immediately removes admin-only API
actions — tested directly against the API, independent of the UI.
"""

import uuid

from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.core.security import hash_password


def test_sec_t_05_role_downgrade_removes_admin_actions(client, db):
    unique = uuid.uuid4().hex[:8]

    owner = User(email=f"owner_{unique}@test.com", password_hash=hash_password("password123"), name="Owner")
    demoted = User(email=f"demoted_{unique}@test.com", password_hash=hash_password("password123"), name="Demoted")
    db.add_all([owner, demoted])
    db.commit()

    workspace = Workspace(name=f"WS {unique}", owner_id=owner.id)
    db.add(workspace)
    db.commit()

    owner_membership = WorkspaceMember(workspace_id=workspace.id, user_id=owner.id, role="owner")
    demoted_membership = WorkspaceMember(workspace_id=workspace.id, user_id=demoted.id, role="admin")
    db.add_all([owner_membership, demoted_membership])
    db.commit()

    try:
        login_resp = client.post("/auth/login", json={"email": demoted.email, "password": "password123"})
        access_token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}

        # While still Admin: creating a project should succeed.
        before = client.post(
            f"/workspaces/{workspace.id}/projects",
            json={"name": "Before Demotion", "visibility": "workspace_wide"},
            headers=headers,
        )
        assert before.status_code == 200

        # Demote to Member.
        demoted_membership.role = "member"
        db.commit()

        # Same access token, same admin-only action — should now be denied.
        after = client.post(
            f"/workspaces/{workspace.id}/projects",
            json={"name": "After Demotion", "visibility": "workspace_wide"},
            headers=headers,
        )
        assert after.status_code == 403, (
            "SEC-T-05 FAILED: a demoted Admin could still perform an "
            "admin-only action after their role was downgraded to Member."
        )

    finally:
        from app.models.project import Project
        db.query(Project).filter(Project.workspace_id == workspace.id).delete()
        db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace.id).delete()
        db.query(Workspace).filter(Workspace.id == workspace.id).delete()
        from app.models.refresh_token import RefreshToken
        db.query(RefreshToken).filter(RefreshToken.user_id.in_([owner.id, demoted.id])).delete(synchronize_session=False)
        db.query(User).filter(User.id.in_([owner.id, demoted.id])).delete(synchronize_session=False)
        db.commit()