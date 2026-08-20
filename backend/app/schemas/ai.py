from datetime import datetime
from pydantic import BaseModel


class AskRequest(BaseModel):
    project_id: str
    question: str


class Citation(BaseModel):
    document_id: str
    filename: str
    page_or_section: str | None


class AIMessageResponse(BaseModel):
    role: str
    content: str
    citations: list[Citation] | None
    created_at: datetime

    class Config:
        from_attributes = True