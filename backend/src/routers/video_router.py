from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlmodel import Session

from core.security import get_current_user
from crud.video_crud import (
    add_view,
    create_video,
    delete_video,
    get_recommended_videos,
    get_video_by_id,
    get_video_detail,
    get_videos,
    update_video,
)
from database.database import get_session
from models.user_model import User
from models.video_model import Video
from schemas.video_schema import VideoRead, ViewsRead
from services.s3_service import (
    delete_file_from_s3_or_local,
    upload_thumbnail,
    upload_video,
    upload_video_and_thumbnail,
)

router = APIRouter(prefix="/videos", tags=["Videos"])


def get_own_video_or_error(session: Session, video_id: int, user: User) -> Video:
    video = get_video_by_id(session, video_id)
    if video is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video no encontrado")
    if video.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No eres el propietario de este video",
        )
    return video


@router.get("", response_model=List[VideoRead])
def list_videos(
    user_id: Optional[int] = None,
    search: Optional[str] = Query(None, max_length=100),
    sort: Literal["recent", "popular"] = "recent",
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session),
):
    """Catalogo de la pagina principal, o los videos de un usuario (Mis videos)."""
    return get_videos(session, user_id=user_id, search=search, sort=sort, limit=limit, offset=offset)


@router.post("", response_model=VideoRead, status_code=status.HTTP_201_CREATED)
def publish_video(
    title: str = Form(..., min_length=1, max_length=150),
    description: str = Form("", max_length=5000),
    video_file: UploadFile = File(...),
    thumbnail_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Sube el MP4 y la miniatura a S3 y guarda los datos del video en la base de datos."""
    video_url, thumbnail_url = upload_video_and_thumbnail(video_file, thumbnail_file)
    created = create_video(
        session,
        title=title.strip(),
        description=description.strip(),
        video_url=video_url,
        thumbnail_url=thumbnail_url,
        user_id=current_user.id,
    )
    return get_video_detail(session, created.id)


@router.get("/{video_id}", response_model=VideoRead)
def get_video(video_id: int, session: Session = Depends(get_session)):
    video = get_video_detail(session, video_id)
    if video is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video no encontrado")
    return video


@router.get("/{video_id}/recommended", response_model=List[VideoRead])
def recommended_videos(
    video_id: int,
    limit: int = Query(12, ge=1, le=30),
    session: Session = Depends(get_session),
):
    video = get_video_by_id(session, video_id)
    if video is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video no encontrado")
    return get_recommended_videos(session, video, limit)


@router.post("/{video_id}/view", response_model=ViewsRead)
def register_view(video_id: int, session: Session = Depends(get_session)):
    """Suma una vista cuando el video empieza a reproducirse."""
    if get_video_by_id(session, video_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video no encontrado")
    return {"id": video_id, "views": add_view(session, video_id)}


@router.put("/{video_id}", response_model=VideoRead)
def update_video_info(
    video_id: int,
    title: Optional[str] = Form(None, min_length=1, max_length=150),
    description: Optional[str] = Form(None, max_length=5000),
    video_file: Optional[UploadFile] = File(None),
    thumbnail_file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Actualiza titulo, descripcion y, opcionalmente, reemplaza el video o la miniatura."""
    video = get_own_video_or_error(session, video_id, current_user)
    fields = {
        "title": title.strip() if title else None,
        "description": description.strip() if description is not None else None,
    }
    old_urls = []

    if video_file is not None and video_file.filename:
        old_urls.append(video.video_url)
        fields["video_url"] = upload_video(video_file)
    if thumbnail_file is not None and thumbnail_file.filename:
        old_urls.append(video.thumbnail_url)
        fields["thumbnail_url"] = upload_thumbnail(thumbnail_file)

    update_video(session, video, **fields)
    for url in old_urls:
        delete_file_from_s3_or_local(url)
    return get_video_detail(session, video_id)


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_video_endpoint(
    video_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Elimina el video, sus comentarios y sus archivos en S3."""
    video = get_own_video_or_error(session, video_id, current_user)
    urls = [video.video_url, video.thumbnail_url]
    delete_video(session, video)
    for url in urls:
        delete_file_from_s3_or_local(url)
