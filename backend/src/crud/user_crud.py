from typing import Optional

from sqlmodel import Session, func, select

from core.security import hash_password, verify_password
from models.user_model import User
from models.video_model import Video
from schemas.user_schema import UserCreate


def get_user_by_id(session: Session, user_id: int) -> Optional[User]:
    return session.get(User, user_id)


def get_user_by_email(session: Session, email: str) -> Optional[User]:
    statement = select(User).where(func.lower(User.email) == email.strip().lower())
    return session.exec(statement).first()


def count_user_videos(session: Session, user_id: int) -> int:
    statement = select(func.count()).select_from(Video).where(Video.user_id == user_id)
    return session.exec(statement).one()


def to_user_read(session: Session, user: User) -> dict:
    """Usuario listo para responder: datos basicos + cantidad de videos publicados."""
    data = user.model_dump(exclude={"password_hash"})
    data["video_count"] = count_user_videos(session, user.id)
    return data


def create_user(session: Session, data: UserCreate) -> User:
    user = User(
        name=data.name.strip(),
        email=data.email.strip().lower(),
        password_hash=hash_password(data.password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def authenticate_user(session: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(session, email)
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user
