from datetime import datetime
from pydantic import BaseModel


class UploadUrlRequest(BaseModel):
    project_id: str
    folder_id: str | None = None
    filename: str
    mime_type: str
    size_bytes: int


class UploadUrlResponse(BaseModel):
    upload_url: str
    document_id: str
    version_id: str
    object_storage_key: str


class UploadCompleteRequest(BaseModel):
    document_id: str
    version_id: str


class DocumentVersionResponse(BaseModel):
    filename: str
    mime_type: str
    size_bytes: int
    status: str
    failure_reason: str | None
    uploaded_at: datetime

    class Config:
        from_attributes = True


class DocumentResponse(BaseModel):
    id: str
    project_id: str
    folder_id: str | None
    restricted: bool
    current_version: DocumentVersionResponse | None

    class Config:
        from_attributes = True