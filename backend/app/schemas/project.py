import uuid
from datetime import datetime
from pydantic import BaseModel


class ProjectCreateRequest(BaseModel):
    name: str
    visibility: str = "workspace_wide"


class ProjectResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    visibility: str
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectPermissionRequest(BaseModel):
    user_ids: list[uuid.UUID]