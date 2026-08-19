import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from app.core.db import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    folder_id = Column(UUID(as_uuid=True), ForeignKey("folders.id"), nullable=True)
    #  intentionally NOT a ForeignKey to document_versions — that would
    # create a circular table-creation dependency (Document needs
    # DocumentVersion to exist, DocumentVersion needs Document to exist).
    # We enforce the relationship in application code instead. Simple and
    # sufficient for v1.
    current_version_id = Column(UUID(as_uuid=True), nullable=True)
    restricted = Column(Boolean, default=False, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    deleted_at = Column(DateTime(timezone=True), nullable=True)