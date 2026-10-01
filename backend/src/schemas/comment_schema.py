from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=1000)


class CommentRead(BaseModel):
    id: int
    content: str
    user_id: int
    video_id: int
    created_at: datetime
    user_name: Optional[str] = None

    class Config:
        from_attributes = True
