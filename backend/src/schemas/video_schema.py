from datetime import datetime

from pydantic import BaseModel, ConfigDict


class VideoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    video_url: str
    thumbnail_url: str
    views: int
    user_id: int
    user_name: str
    created_at: datetime


class ViewsRead(BaseModel):
    id: int
    views: int
