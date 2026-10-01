from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class Video(SQLModel, table=True):
    __tablename__ = "videos"

    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    description: str = Field(default="")
    video_url: str
    thumbnail_url: str
    views: int = Field(default=0)
    user_id: int = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
