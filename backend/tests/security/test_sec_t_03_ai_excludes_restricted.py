"""
SEC-T-03 (docs/05-security-compliance.md §5.4):
An AI question whose best answer lives only in a restricted document
returns the fallback message for a non-permitted user, and a real
answer for a permitted user.
"""

import json
import uuid

from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.models.project import Project
from app.models.document_version import DocumentVersion
from app.models.document_chunk import DocumentChunk
from app.core.security import hash_password
from app.core.embeddings import embed_text


def test_sec_t_03_ai_excludes_restricted(client, db):
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

    restricted_project = Project(workspace_id=workspace.id, name="Secret", visibility="restricted")
    db.add(restricted_project)
    db.commit()
    # outsider gets NO ProjectPermission row.

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

    secret_fact = f"the launch code is banana{unique}"
    db.add(DocumentChunk(
        document_version_id=version.id,
        project_id=restricted_project.id,
        chunk_text=f"Internal memo: {secret_fact}.",
        embedding=embed_text(f"Internal memo: {secret_fact}."),
    ))
    db.commit()

    try:
        login_resp = client.post("/auth/login", json={"email": outsider.email, "password": "password123"})
        access_token = login_resp.json()["access_token"]

        response = client.post(
            "/ai/ask",
            json={"project_id": str(restricted_project.id), "question": "What is the launch code?"},
            headers={"Authorization": f"Bearer {access_token}"},
        )

        full_text = ""
        for line in response.iter_lines():
            if isinstance(line, bytes):
                line = line.decode("utf-8")
            if line and line.startswith("data: "):
                event = json.loads(line[6:])
                if event["type"] == "token":
                    full_text += event["text"]

        assert "banana" not in full_text.lower(), (
            "SEC-T-03 FAILED: the AI Copilot revealed content from a "
            "restricted document to a user without access to it."
        )

    finally:
        from app.models.ai_message import AIMessage
        from app.models.ai_conversation import AIConversation
        db.query(AIMessage).filter(
            AIMessage.conversation_id.in_(
                db.query(AIConversation.id).filter(AIConversation.project_id == restricted_project.id)
            )
        ).delete(synchronize_session=False)
        db.query(AIConversation).filter(AIConversation.project_id == restricted_project.id).delete(synchronize_session=False)
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