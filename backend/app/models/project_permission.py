import uuid

from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.core.db import Base


class ProjectPermission(Base):
    """Only populated when Project.visibility == 'restricted' — lists
    exactly which users can see this project. This table is what
    docs/05-security-compliance.md §5 filters against everywhere."""

    __tablename__ = "project_permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)