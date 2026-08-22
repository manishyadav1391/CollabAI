"""
SEC-T-06 (extends docs/05-security-compliance.md §5.4 to document-level
restriction): a document marked `restricted` inside an otherwise
workspace-wide project is invisible to search and AI retrieval for a
member without an explicit DocumentPermission grant, and visible once
granted.
"""

import json
import uuid

from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.models.project import Project
from app.models.document import Document
from app.models.document_version import DocumentVersion
from app.models.document_chunk import DocumentChunk
from app.models.document_permission import DocumentPermission
from app.core.security import hash_password
from app.core.embeddings import embed_text


def test_sec_t_06_document_level_restriction(client, db):
    unique = uuid.uuid4().hex[:8]

    owner = User(email=f"owner_{unique}@test.com", password_hash=hash_password("password123"), name="Owner")
    outsider = User(email=f"outsider_{unique}@test.com", password_hash=hash_password("password123"), name="Outsider")
    permitted = User(email=f"permitted_{unique}@test.com", password_hash=hash_password("password123"), name="Permitted")
    db.add_all([owner, outsider, permitted])
    db.commit()

    workspace = Workspace(name=f"WS {unique}", owner_id=owner.id)
    db.add(workspace)
    db.commit()

    db.add_all([
        WorkspaceMember(workspace_id=workspace.id, user_id=owner.id, role="owner"),
        WorkspaceMember(workspace_id=workspace.id, user_id=outsider.id, role="member"),
        WorkspaceMember(workspace_id=workspace.id, user_id=permitted.id, role="member"),
    ])
    db.commit()

    # workspace_wide, NOT restricted at the project level — every member
    # can see the project itself. The document inside it is individually
    # restricted, which is the thing under test here.
    project = Project(workspace_id=workspace.id, name="Shared", visibility="workspace_wide")
    db.add(project)
    db.commit()

    doc = Document(project_id=project.id, created_by=owner.id, restricted=True)
    db.add(doc)
    db.commit()

    version = DocumentVersion(
        document_id=doc.id, object_storage_key="fake/key", filename="secret.txt",
        mime_type="text/plain", size_bytes=100, status="ready",
    )
    db.add(version)
    db.commit()
    doc.current_version_id = version.id
    db.commit()

    secret_term = f"unobtainium{unique}"
    db.add(DocumentChunk(
        document_version_id=version.id,
        project_id=project.id,
        chunk_text=f"The formula requires exactly one gram of {secret_term} per batch.",
        embedding=embed_text(f"The formula requires exactly one gram of {secret_term} per batch."),
    ))
    db.commit()
    db.add(DocumentPermission(document_id=doc.id, user_id=permitted.id))
    db.commit()

    try:
        outsider_token = client.post(
            "/auth/login", json={"email": outsider.email, "password": "password123"}
        ).json()["access_token"]
        permitted_token = client.post(
            "/auth/login", json={"email": permitted.email, "password": "password123"}
        ).json()["access_token"]

        # 1. Search: outsider gets zero results, permitted user gets the hit.
        outsider_search = client.get(
            "/search", params={"q": secret_term}, headers={"Authorization": f"Bearer {outsider_token}"}
        )
        assert outsider_search.status_code == 200
        assert outsider_search.json()["results"] == [], (
            "SEC-T-06 FAILED: search returned a result from a document-level "
            "restricted document to a user without an explicit grant."
        )

        permitted_search = client.get(
            "/search", params={"q": secret_term}, headers={"Authorization": f"Bearer {permitted_token}"}
        )
        assert len(permitted_search.json()["results"]) == 1

        # 2. Direct download: outsider is denied, permitted user is allowed.
        outsider_dl = client.get(
            f"/documents/{doc.id}/download-url", headers={"Authorization": f"Bearer {outsider_token}"}
        )
        assert outsider_dl.status_code == 403

        permitted_dl = client.get(
            f"/documents/{doc.id}/download-url", headers={"Authorization": f"Bearer {permitted_token}"}
        )
        assert permitted_dl.status_code == 200

        # 3. AI retrieval: outsider gets the "no relevant info" fallback.
        def ask(token):
            resp = client.post(
                "/ai/ask",
                json={"project_id": str(project.id), "question": "What is the exact quantity needed?"},
                headers={"Authorization": f"Bearer {token}"},
            )
            full_text = ""
            for line in resp.iter_lines():
                if isinstance(line, bytes):
                    line = line.decode("utf-8")
                if line and line.startswith("data: "):
                    event = json.loads(line[6:])
                    if event["type"] == "token":
                        full_text += event["text"]
            return full_text

        assert "unobtainium" not in ask(outsider_token).lower(), (
            "SEC-T-06 FAILED: the AI Copilot revealed content from a "
            "document-level restricted document to a user without access."
        )

    finally:
        from app.models.ai_message import AIMessage
        from app.models.ai_conversation import AIConversation
        db.query(AIMessage).filter(
            AIMessage.conversation_id.in_(
                db.query(AIConversation.id).filter(AIConversation.project_id == project.id)
            )
        ).delete(synchronize_session=False)
        db.query(AIConversation).filter(AIConversation.project_id == project.id).delete(synchronize_session=False)
        db.query(DocumentPermission).filter(DocumentPermission.document_id == doc.id).delete()
        db.query(DocumentChunk).filter(DocumentChunk.document_version_id == version.id).delete()
        db.query(DocumentVersion).filter(DocumentVersion.id == version.id).delete()
        db.query(Document).filter(Document.id == doc.id).delete()
        db.query(Project).filter(Project.id == project.id).delete()
        db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace.id).delete()
        db.query(Workspace).filter(Workspace.id == workspace.id).delete()
        from app.models.refresh_token import RefreshToken
        db.query(RefreshToken).filter(
            RefreshToken.user_id.in_([owner.id, outsider.id, permitted.id])
        ).delete(synchronize_session=False)
        db.query(User).filter(User.id.in_([owner.id, outsider.id, permitted.id])).delete(synchronize_session=False)
        db.commit()
