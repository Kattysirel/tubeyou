from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.models.user import User
from src.models.video import Video
from src.schemas.user import UserCreate
from src.security.hashing import hash_password, verify_password


def get_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def get_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(func.lower(User.email) == email.lower()))


def create(db: Session, data: UserCreate) -> User:
    user = User(
        name=data.name.strip(),
        email=data.email.lower(),
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate(db: Session, email: str, password: str) -> User | None:
    user = get_by_email(db, email)
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user


def count_videos(db: Session, user_id: int) -> int:
    return db.scalar(select(func.count()).select_from(Video).where(Video.user_id == user_id)) or 0
