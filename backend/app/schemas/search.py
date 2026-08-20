from pydantic import BaseModel


class SearchResultItem(BaseModel):
    document_id: str
    filename: str
    project_id: str
    snippet: str


class SearchResponse(BaseModel):
    results: list[SearchResultItem]