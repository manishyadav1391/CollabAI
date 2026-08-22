import uuid

from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.core.db import Base


class DocumentPermission(Base):
    """Only populated when Document.restricted is True — lists exactly
    which users (besides the uploader) can see this document. Mirrors
    ProjectPermission; filtered against the same way in
    core/permission_filter.py, everywhere documents/search/AI retrieval
    read chunks or file content."""

    __tablename__ = "document_permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
