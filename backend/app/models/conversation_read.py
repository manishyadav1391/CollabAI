import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, BigInteger, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from app.core.db import Base


class ConversationRead(Base):
    """Per-user read cursor for a conversation: the highest message
    `sequence_number` this user has seen, for both "room" and "dm"
    conversations. One row per (conversation, user), created lazily on
    first read rather than up front."""

    __tablename__ = "conversation_reads"
    __table_args__ = (UniqueConstraint("conversation_id", "user_id"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    last_read_sequence_number = Column(BigInteger, nullable=False, default=0)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
