from typing import Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from src.core.config import settings
from src.core.security import get_current_user
from src.crud import video_crud
from src.database.database import get_db
from src.models.user_model import User
from src.schemas.video_schema import VideoRead, ViewsRead
from src.services.storage_service import THUMBNAILS, VIDEOS, extension_of, get_storage

router = APIRouter(prefix="/videos", tags=["Videos"])

VIDEO_EXTENSIONS = {".mp4"}
VIDEO_TYPES = {"video/mp4"}
THUMB_EXTENSIONS = {".jpg", ".jpeg", ".png"}
THUMB_TYPES = {"image/jpeg", "image/png"}


def _size(upload: UploadFile) -> int:
    upload.file.seek(0, 2)
    size = upload.file.tell()
    upload.file.seek(0)
    return size


def _validate(upload: UploadFile, extensions: set[str], types: set[str], max_bytes: int, label: str) -> str:
    extension = extension_of(upload.filename)
    if extension not in extensions or upload.content_type not in types:
        allowed = ", ".join(sorted(e.lstrip(".").upper() for e in extensions))
        raise HTTPException(422, f"{label}: formato no permitido (solo {allowed})")
    size = _size(upload)
    if size == 0:
        raise HTTPException(422, f"{label}: el archivo esta vacio")
    if size > max_bytes:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"{label}: supera el maximo de {max_bytes // (1024 * 1024)} MB",
        )
    return extension


def _get_or_404(db: Session, video_id: int):
    video = video_crud.get(db, video_id)
    if video is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Video no encontrado")
    return video


def _owned_or_403(db: Session, video_id: int, user: User):
    video = _get_or_404(db, video_id)
    if video.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No eres el propietario de este video")
    return video


@router.get("", response_model=list[VideoRead])
def list_videos(
    q: str | None = Query(None, max_length=100),
    user_id: int | None = None,
    sort: Literal["recent", "popular"] = "recent",
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return video_crud.list_videos(db, q=q, user_id=user_id, sort=sort, skip=skip, limit=limit)


@router.post("", response_model=VideoRead, status_code=status.HTTP_201_CREATED)
def create_video(
    title: str = Form(..., min_length=1, max_length=150),
    description: str = Form("", max_length=5000),
    video: UploadFile = File(...),
    thumbnail: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video_ext = _validate(video, VIDEO_EXTENSIONS, VIDEO_TYPES, settings.MAX_VIDEO_BYTES, "Video")
    thumb_ext = _validate(thumbnail, THUMB_EXTENSIONS, THUMB_TYPES, settings.MAX_THUMB_BYTES, "Miniatura")

    storage = get_storage()
    video_url = storage.save(VIDEOS, video.file, video_ext, "video/mp4")
    try:
        thumb_url = storage.save(THUMBNAILS, thumbnail.file, thumb_ext, thumbnail.content_type)
    except Exception:
        storage.delete(video_url)
        raise
    return video_crud.create(db, title.strip(), description.strip(), video_url, thumb_url, current_user.id)


@router.get("/{video_id}", response_model=VideoRead)
def get_video(video_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, video_id)


@router.get("/{video_id}/recommended", response_model=list[VideoRead])
def recommended(video_id: int, limit: int = Query(12, ge=1, le=30), db: Session = Depends(get_db)):
    return video_crud.recommended(db, _get_or_404(db, video_id), limit)


@router.post("/{video_id}/view", response_model=ViewsRead)
def register_view(video_id: int, db: Session = Depends(get_db)):
    _get_or_404(db, video_id)
    return ViewsRead(id=video_id, views=video_crud.add_view(db, video_id))


@router.put("/{video_id}", response_model=VideoRead)
def update_video(
    video_id: int,
    title: str | None = Form(None, min_length=1, max_length=150),
    description: str | None = Form(None, max_length=5000),
    video: UploadFile | None = File(None),
    thumbnail: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current = _owned_or_403(db, video_id, current_user)
    storage = get_storage()
    fields: dict = {
        "title": title.strip() if title else None,
        "description": description.strip() if description is not None else None,
    }
    old_urls: list[str] = []

    if video is not None and video.filename:
        ext = _validate(video, VIDEO_EXTENSIONS, VIDEO_TYPES, settings.MAX_VIDEO_BYTES, "Video")
        old_urls.append(current.video_url)
        fields["video_url"] = storage.save(VIDEOS, video.file, ext, "video/mp4")
    if thumbnail is not None and thumbnail.filename:
        ext = _validate(thumbnail, THUMB_EXTENSIONS, THUMB_TYPES, settings.MAX_THUMB_BYTES, "Miniatura")
        old_urls.append(current.thumbnail_url)
        fields["thumbnail_url"] = storage.save(THUMBNAILS, thumbnail.file, ext, thumbnail.content_type)

    updated = video_crud.update_fields(db, current, **fields)
    for url in old_urls:
        storage.delete(url)
    return updated


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current = _owned_or_403(db, video_id, current_user)
    urls = [current.video_url, current.thumbnail_url]
    video_crud.delete(db, current)
    storage = get_storage()
    for url in urls:
        storage.delete(url)
