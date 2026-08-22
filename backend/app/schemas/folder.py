from pydantic import BaseModel


class FolderCreateRequest(BaseModel):
    project_id: str
    parent_folder_id: str | None = None
    name: str


class FolderResponse(BaseModel):
    id: str
    project_id: str
    parent_folder_id: str | None
    name: str

    class Config:
        from_attributes = True
