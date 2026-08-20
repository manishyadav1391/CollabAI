"""
SEC-T-01 (docs/05-security-compliance.md §5.4):
A user without project access cannot fetch a document in that project
via direct API call.
"""

import uuid
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.models.project import Project
from app.core.security import hash_password


def test_sec_t_01_no_direct_access_without_permission(client, db):
    unique = uuid.uuid4().hex[:8]

    owner = User(email=f"owner_{unique}@test.com", password_hash=hash_password("password123"), name="Owner")
    outsider = User(email=f"outsider_{unique}@test.com", password_hash=hash_password("password123"), name="Outsider")
    db.add_all([owner, outsider])
    db.commit()

    workspace = Workspace(name=f"WS {unique}", owner_id=owner.id)
    db.add(workspace)
    db.commit()

    # Note: outsider is NOT added as a WorkspaceMember at all here —
    # the strictest possible case: zero relationship to this workspace.
    db.add(WorkspaceMember(workspace_id=workspace.id, user_id=owner.id, role="owner"))
    db.commit()

    project = Project(workspace_id=workspace.id, name="Private", visibility="workspace_wide")
    db.add(project)
    db.commit()

    try:
        login_resp = client.post("/auth/login", json={"email": outsider.email, "password": "password123"})
        access_token = login_resp.json()["access_token"]

        response = client.get(
            "/documents",
            params={"project_id": str(project.id)},
            headers={"Authorization": f"Bearer {access_token}"},
        )

        assert response.status_code == 403, (
            "SEC-T-01 FAILED: a user with no relationship to the workspace "
            "was able to list documents in one of its projects."
        )

    finally:
        db.query(Project).filter(Project.id == project.id).delete()
        db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace.id).delete()
        db.query(Workspace).filter(Workspace.id == workspace.id).delete()
        from app.models.refresh_token import RefreshToken
        db.query(RefreshToken).filter(RefreshToken.user_id.in_([owner.id, outsider.id])).delete(synchronize_session=False)
        db.query(User).filter(User.id.in_([owner.id, outsider.id])).delete(synchronize_session=False)
        db.commit()