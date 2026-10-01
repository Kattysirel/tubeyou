from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.security import get_current_user
from crud import comment_crud, video_crud
from database.database import get_db
from models.user_model import User
from schemas.comment_schema import CommentCreate, CommentRead

router = APIRouter(prefix="/videos/{video_id}/comments", tags=["Comentarios"])


def _ensure_video(db: Session, video_id: int) -> None:
    if video_crud.get(db, video_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Video no encontrado")


@router.get("", response_model=list[CommentRead])
def list_comments(video_id: int, db: Session = Depends(get_db)):
    _ensure_video(db, video_id)
    return comment_crud.list_for_video(db, video_id)


@router.post("", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
def create_comment(
    video_id: int,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_video(db, video_id)
    if not data.content.strip():
        raise HTTPException(422, "El comentario no puede estar vacio")
    return comment_crud.create(db, video_id, current_user.id, data.content)
