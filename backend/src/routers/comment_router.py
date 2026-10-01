from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from core.security import get_current_user
from crud.comment_crud import create_comment, get_comments_by_video_id
from crud.video_crud import get_video_by_id
from database.database import get_session
from models.user_model import User
from schemas.comment_schema import CommentCreate, CommentRead

router = APIRouter(prefix="/videos", tags=["Comentarios"])


def ensure_video_exists(session: Session, video_id: int) -> None:
    if get_video_by_id(session, video_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video no encontrado")


@router.post("/{video_id}/comments", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
def add_comment(
    video_id: int,
    data: CommentCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    ensure_video_exists(session, video_id)
    if not data.content.strip():
        raise HTTPException(
            status_code=422,
            detail="El comentario no puede estar vacio",
        )
    return create_comment(session, video_id=video_id, user_id=current_user.id, content=data.content)


@router.get("/{video_id}/comments", response_model=List[CommentRead])
def list_comments(video_id: int, session: Session = Depends(get_session)):
    ensure_video_exists(session, video_id)
    return get_comments_by_video_id(session, video_id)
