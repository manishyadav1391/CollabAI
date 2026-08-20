"""
SEC-T-02 (docs/05-security-compliance.md §5.4):
A term existing only in a restricted document must return zero search
results for a user who isn't granted access to that project.

NOTE: this test runs against your real dev database and cleans up its
own rows manually at the end. A properly isolated test database is a
known improvement to make during Phase 8 hardening — acceptable
tradeoff for now so you can verify the security boundary today.
"""

import uuid

from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.models.project import Project
from app.models.document_version import DocumentVersion
from app.models.document_chunk import DocumentChunk
from app.core.security import hash_password
import pytest


def test_sec_t_02_search_excludes_restricted(client, db):
    unique = uuid.uuid4().hex[:8]

    owner = User(email=f"owner_{unique}@test.com", password_hash=hash_password("password123"), name="Owner")
    outsider = User(email=f"outsider_{unique}@test.com", password_hash=hash_password("password123"), name="Outsider")
    db.add_all([owner, outsider])
    db.commit()

    workspace = Workspace(name=f"WS {unique}", owner_id=owner.id)
    db.add(workspace)
    db.commit()

    db.add_all([
        WorkspaceMember(workspace_id=workspace.id, user_id=owner.id, role="owner"),
        WorkspaceMember(workspace_id=workspace.id, user_id=outsider.id, role="member"),
    ])
    db.commit()

    restricted_project = Project(workspace_id=workspace.id, name="Secret Project", visibility="restricted")
    db.add(restricted_project)
    db.commit()
    # Deliberately NOT granting outsider a ProjectPermission row.

    from app.models.document import Document
    doc = Document(project_id=restricted_project.id, created_by=owner.id)
    db.add(doc)
    db.commit()

    version = DocumentVersion(
        document_id=doc.id, object_storage_key="fake/key", filename="secret.txt",
        mime_type="text/plain", size_bytes=100, status="ready",
    )
    db.add(version)
    db.commit()

    secret_term = f"unobtainium{unique}"
    db.add(DocumentChunk(
        document_version_id=version.id,
        project_id=restricted_project.id,
        chunk_text=f"The formula requires exactly one gram of {secret_term} per batch.",
        embedding=[0.0] * 384,
    ))
    db.commit()

    try:
        login_resp = client.post("/auth/login", json={"email": outsider.email, "password": "password123"})
        access_token = login_resp.json()["access_token"]

        response = client.get(
            "/search",
            params={"q": secret_term},
            headers={"Authorization": f"Bearer {access_token}"},
        )

        assert response.status_code == 200
        assert response.json()["results"] == [], (
            "SEC-T-02 FAILED: a user without project access saw a search "
            "result from a restricted project. This is the exact leak "
            "docs/05-security-compliance.md §5 exists to prevent."
        )

    finally:
        db.query(DocumentChunk).filter(DocumentChunk.document_version_id == version.id).delete()
        db.query(DocumentVersion).filter(DocumentVersion.id == version.id).delete()
        db.query(Document).filter(Document.id == doc.id).delete()
        db.query(Project).filter(Project.id == restricted_project.id).delete()
        db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace.id).delete()
        db.query(Workspace).filter(Workspace.id == workspace.id).delete()
        from app.models.refresh_token import RefreshToken
        db.query(RefreshToken).filter(RefreshToken.user_id.in_([owner.id, outsider.id])).delete(synchronize_session=False)
        db.query(User).filter(User.id.in_([owner.id, outsider.id])).delete(synchronize_session=False)
        db.commit()