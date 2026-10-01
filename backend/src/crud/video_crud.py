from typing import List, Optional

from sqlmodel import Session, delete, func, select, update

from models.comment_model import Comment
from models.user_model import User
from models.video_model import Video


def _with_user_name(video: Video, user_name: Optional[str]) -> dict:
    data = video.model_dump()
    data["user_name"] = user_name
    return data


def get_video_by_id(session: Session, video_id: int) -> Optional[Video]:
    return session.get(Video, video_id)


def get_video_detail(session: Session, video_id: int) -> Optional[dict]:
    statement = select(Video, User.name).join(User, Video.user_id == User.id).where(Video.id == video_id)
    row = session.exec(statement).first()
    return _with_user_name(*row) if row else None


def create_video(
    session: Session,
    title: str,
    description: str,
    video_url: str,
    thumbnail_url: str,
    user_id: int,
) -> Video:
    video = Video(
        title=title,
        description=description,
        video_url=video_url,
        thumbnail_url=thumbnail_url,
        user_id=user_id,
    )
    session.add(video)
    session.commit()
    session.refresh(video)
    return video


def get_videos(
    session: Session,
    user_id: Optional[int] = None,
    search: Optional[str] = None,
    sort: str = "recent",
    limit: int = 50,
    offset: int = 0,
) -> List[dict]:
    statement = select(Video, User.name).join(User, Video.user_id == User.id)

    if user_id is not None:
        statement = statement.where(Video.user_id == user_id)
    if search:
        statement = statement.where(func.lower(Video.title).like(f"%{search.strip().lower()}%"))

    if sort == "popular":
        statement = statement.order_by(Video.views.desc(), Video.created_at.desc())
    else:
        statement = statement.order_by(Video.created_at.desc(), Video.id.desc())

    rows = session.exec(statement.offset(offset).limit(limit)).all()
    return [_with_user_name(video, user_name) for video, user_name in rows]


def get_recommended_videos(session: Session, video: Video, limit: int = 12) -> List[dict]:
    """Otros videos del mismo autor primero y luego los mas vistos."""
    statement = (
        select(Video, User.name)
        .join(User, Video.user_id == User.id)
        .where(Video.id != video.id)
        .order_by((Video.user_id == video.user_id).desc(), Video.views.desc(), Video.created_at.desc())
        .limit(limit)
    )
    rows = session.exec(statement).all()
    return [_with_user_name(v, user_name) for v, user_name in rows]


def update_video(session: Session, video: Video, **fields) -> Video:
    for key, value in fields.items():
        if value is not None:
            setattr(video, key, value)
    session.add(video)
    session.commit()
    session.refresh(video)
    return video


def add_view(session: Session, video_id: int) -> Optional[int]:
    session.exec(update(Video).where(Video.id == video_id).values(views=Video.views + 1))
    session.commit()
    return session.exec(select(Video.views).where(Video.id == video_id)).first()


def delete_video(session: Session, video: Video) -> None:
    """Elimina el video y sus comentarios."""
    session.exec(delete(Comment).where(Comment.video_id == video.id))
    session.delete(video)
    session.commit()
