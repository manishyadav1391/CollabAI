import uuid
from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector

from app.core.db import Base


class DocumentChunk(Base):
    """
    One row per text chunk of a processed document, with its embedding
    vector. This table is what Phase 4 (search) and Phase 5 (AI) query
    against — always through core/permission_filter.py, never directly
    (docs/05-security-compliance.md §5).
    """

    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_version_id = Column(UUID(as_uuid=True), ForeignKey("document_versions.id"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)  # denormalized for fast permission filtering
    chunk_text = Column(Text, nullable=False)
    page_or_section = Column(String, nullable=True)
    embedding = Column(Vector(384), nullable=False)  # 384 dims matches all-MiniLM-L6-v2