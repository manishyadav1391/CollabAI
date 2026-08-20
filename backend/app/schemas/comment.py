import uuid
from datetime import datetime
from pydantic import BaseModel


class CommentCreateRequest(BaseModel):
    content: str
    parent_comment_id: str | None = None


class CommentResponse(BaseModel):
    id: uuid.UUID
    parent_comment_id: uuid.UUID | None
    author_id: uuid.UUID
    content: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True