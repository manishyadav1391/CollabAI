import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from app.core.db import Base


class Conversation(Base):
    """A conversation scoped to a project: either the one shared "room" for
    the whole project, or a "dm" between exactly two participants (see
    ConversationParticipant). A project has at most one "room" conversation
    but any number of "dm" conversations."""

    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    kind = Column(String, nullable=False, default="room")  # "room" | "dm"
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))