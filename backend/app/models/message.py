import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Text, DateTime, ForeignKey, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from app.core.db import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    sequence_number = Column(BigInteger, nullable=False)  # FR-CHAT-03: client-side ordering
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))