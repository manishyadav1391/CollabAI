from datetime import datetime
from pydantic import BaseModel


class UploadUrlRequest(BaseModel):
    project_id: str
    folder_id: str | None = None
    filename: str
    mime_type: str
    size_bytes: int
    # Set to add a new version to an existing document instead of creating a
    # new one (FR-DOC-07 re-upload).
    document_id: str | None = None


class UploadUrlResponse(BaseModel):
    upload_url: str
    document_id: str
    version_id: str
    object_storage_key: str


class UploadCompleteRequest(BaseModel):
    document_id: str
    version_id: str


class MultipartInitiateRequest(BaseModel):
    project_id: str
    folder_id: str | None = None
    filename: str
    mime_type: str
    size_bytes: int
    document_id: str | None = None


class MultipartInitiateResponse(BaseModel):
    document_id: str
    version_id: str
    upload_id: str
    object_storage_key: str
    part_size_bytes: int
    total_parts: int


class MultipartPartUrlRequest(BaseModel):
    document_id: str
    version_id: str
    part_number: int


class MultipartPartUrlResponse(BaseModel):
    url: str


class MultipartPartInfo(BaseModel):
    part_number: int
    etag: str
    size_bytes: int


class MultipartCompletePart(BaseModel):
    part_number: int
    etag: str


class MultipartCompleteRequest(BaseModel):
    document_id: str
    version_id: str
    parts: list[MultipartCompletePart]


class MultipartAbortRequest(BaseModel):
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
    created_by: str
    current_version: DocumentVersionResponse | None

    class Config:
        from_attributes = True


class DocumentVersionListItem(BaseModel):
    id: str
    filename: str
    mime_type: str
    size_bytes: int
    status: str
    failure_reason: str | None
    uploaded_at: datetime
    is_current: bool


class DocumentPermissionRequest(BaseModel):
    restricted: bool
    user_ids: list[str] = []


class DocumentPermissionResponse(BaseModel):
    restricted: bool
    user_ids: list[str]