import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from app.core.db import Base


class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    object_storage_key = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    size_bytes = Column(BigInteger, nullable=False)
    status = Column(String, nullable=False, default="pending")  # pending|processing|ready|processing_failed|aborted
    failure_reason = Column(String, nullable=True)
    # Set only while a multipart (chunked/resumable) upload is in flight —
    # lets the client resume after a reload by asking S3/MinIO which parts
    # already landed (FR-DOC-05), without having to remember anything itself.
    multipart_upload_id = Column(String, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))