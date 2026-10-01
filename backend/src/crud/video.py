from sqlalchemy import select, update
from sqlalchemy.orm import Session, joinedload

from src.models.video import Video


def get(db: Session, video_id: int) -> Video | None:
    return db.scalar(select(Video).options(joinedload(Video.user)).where(Video.id == video_id))


def list_videos(
    db: Session,
    q: str | None = None,
    user_id: int | None = None,
    sort: str = "recent",
    skip: int = 0,
    limit: int = 50,
) -> list[Video]:
    stmt = select(Video).options(joinedload(Video.user))
    if q:
        stmt = stmt.where(Video.title.ilike(f"%{q}%"))
    if user_id is not None:
        stmt = stmt.where(Video.user_id == user_id)
    if sort == "popular":
        stmt = stmt.order_by(Video.views.desc(), Video.created_at.desc())
    else:
        stmt = stmt.order_by(Video.created_at.desc(), Video.id.desc())
    return list(db.scalars(stmt.offset(skip).limit(limit)))


def recommended(db: Session, video: Video, limit: int = 12) -> list[Video]:
    stmt = (
        select(Video)
        .options(joinedload(Video.user))
        .where(Video.id != video.id)
        .order_by((Video.user_id == video.user_id).desc(), Video.views.desc(), Video.created_at.desc())
        .limit(limit)
    )
    return list(db.scalars(stmt))


def create(
    db: Session, title: str, description: str, video_url: str, thumbnail_url: str, user_id: int
) -> Video:
    video = Video(
        title=title,
        description=description,
        video_url=video_url,
        thumbnail_url=thumbnail_url,
        user_id=user_id,
    )
    db.add(video)
    db.commit()
    return get(db, video.id)


def update_fields(db: Session, video: Video, **fields) -> Video:
    for key, value in fields.items():
        if value is not None:
            setattr(video, key, value)
    db.commit()
    return get(db, video.id)


def delete(db: Session, video: Video) -> None:
    db.delete(video)
    db.commit()


def add_view(db: Session, video_id: int) -> int | None:
    db.execute(update(Video).where(Video.id == video_id).values(views=Video.views + 1))
    db.commit()
    return db.scalar(select(Video.views).where(Video.id == video_id))
