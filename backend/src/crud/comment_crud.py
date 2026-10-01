from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from src.models.comment_model import Comment


def list_for_video(db: Session, video_id: int) -> list[Comment]:
    stmt = (
        select(Comment)
        .options(joinedload(Comment.user))
        .where(Comment.video_id == video_id)
        .order_by(Comment.created_at.desc(), Comment.id.desc())
    )
    return list(db.scalars(stmt))


def create(db: Session, video_id: int, user_id: int, content: str) -> Comment:
    comment = Comment(video_id=video_id, user_id=user_id, content=content.strip())
    db.add(comment)
    db.commit()
    return db.scalar(select(Comment).options(joinedload(Comment.user)).where(Comment.id == comment.id))
