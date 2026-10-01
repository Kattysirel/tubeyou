from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class Comment(SQLModel, table=True):
    __tablename__ = "comments"

    id: int | None = Field(default=None, primary_key=True)
    content: str
    user_id: int = Field(foreign_key="users.id", index=True)
    video_id: int = Field(foreign_key="videos.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
