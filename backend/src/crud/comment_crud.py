from typing import List

from sqlmodel import Session, select

from models.comment_model import Comment
from models.user_model import User


def create_comment(session: Session, video_id: int, user_id: int, content: str) -> dict:
    comment = Comment(video_id=video_id, user_id=user_id, content=content.strip())
    session.add(comment)
    session.commit()
    session.refresh(comment)
    user = session.get(User, user_id)
    data = comment.model_dump()
    data["user_name"] = user.name if user else None
    return data


def get_comments_by_video_id(session: Session, video_id: int) -> List[dict]:
    statement = (
        select(Comment, User.name)
        .join(User, Comment.user_id == User.id)
        .where(Comment.video_id == video_id)
        .order_by(Comment.created_at.desc(), Comment.id.desc())
    )
    rows = session.exec(statement).all()
    comments = []
    for comment, user_name in rows:
        data = comment.model_dump()
        data["user_name"] = user_name
        comments.append(data)
    return comments
