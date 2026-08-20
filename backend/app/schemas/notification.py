from datetime import datetime
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: str
    type: str
    payload: dict | None
    read_at: datetime | None
    created_at: datetime