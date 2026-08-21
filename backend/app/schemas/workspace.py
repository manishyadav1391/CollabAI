import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr


class WorkspaceCreateRequest(BaseModel):
    name: str


class WorkspaceResponse(BaseModel):
    id: uuid.UUID
    name: str
    owner_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class InviteRequest(BaseModel):
    email: EmailStr
    role: str = "member"


class MemberResponse(BaseModel):
    user_id: uuid.UUID
    email: str
    name: str
    role: str


class RoleChangeRequest(BaseModel):
    role: str


class InvitePreviewResponse(BaseModel):
    workspace_id: uuid.UUID
    workspace_name: str
    email: str
    role: str


class AcceptInviteResponse(BaseModel):
    workspace_id: uuid.UUID
    workspace_name: str