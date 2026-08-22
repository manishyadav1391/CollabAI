import uuid
from datetime import datetime
from pydantic import BaseModel


class AskRequest(BaseModel):
    # Exactly one of these must be set: project_id scopes the question to
    # one project, workspace_id asks it across every project in that
    # workspace the caller can see.
    project_id: str | None = None
    workspace_id: str | None = None
    question: str
    conversation_id: str | None = None


class Citation(BaseModel):
    document_id: str
    project_id: str | None = None  # optional: absent on citations persisted before this field existed
    filename: str
    page_or_section: str | None
    chunk_text: str | None = None  # optional: absent on citations persisted before this field existed


class AIMessageResponse(BaseModel):
    role: str
    content: str
    citations: list[Citation] | None
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationSummary(BaseModel):
    id: uuid.UUID
    title: str
    updated_at: datetime
