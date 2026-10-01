from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class VideoRead(BaseModel):
    id: int
    title: str
    description: str
    video_url: str
    thumbnail_url: str
    views: int
    user_id: int
    created_at: datetime
    user_name: Optional[str] = None

    class Config:
        from_attributes = True


class ViewsRead(BaseModel):
    id: int
    views: int
