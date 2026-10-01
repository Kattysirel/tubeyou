import uuid
from pathlib import Path
from typing import Tuple
from urllib.parse import urlparse

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException, UploadFile, status

from core.config import (
    ALLOWED_THUMBNAIL_EXTENSIONS,
    ALLOWED_VIDEO_EXTENSIONS,
    AWS_ACCESS_KEY_ID,
    AWS_REGION,
    AWS_SECRET_ACCESS_KEY,
    MAX_THUMBNAIL_SIZE_BYTES,
    MAX_VIDEO_SIZE_BYTES,
    PUBLIC_BASE_URL,
    S3_BUCKET_THUMBNAILS,
    S3_BUCKET_VIDEOS,
)

VIDEO_CONTENT_TYPES = {"video/mp4"}
THUMBNAIL_CONTENT_TYPES = {"image/jpeg", "image/png"}

# Respaldo local (solo si no hay bucket configurado): src/static/uploads/{videos|thumbnails}
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
UPLOADS_DIR = STATIC_DIR / "uploads"
LOCAL_PREFIX = f"{PUBLIC_BASE_URL}/static/uploads/"


def get_s3_client():
    """En la EC2 las credenciales las entrega el IAM Role; en local se usan las variables si existen."""
    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        return boto3.client(
            "s3",
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        )
    return boto3.client("s3", region_name=AWS_REGION)


def _validate(file: UploadFile, extensions: set, content_types: set, max_size: int, label: str) -> str:
    extension = Path(file.filename or "").suffix.lower()
    if extension not in extensions or file.content_type not in content_types:
        allowed = ", ".join(sorted(e.lstrip(".").upper() for e in extensions))
        raise HTTPException(422, f"{label}: formato no permitido (solo {allowed})")

    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size == 0:
        raise HTTPException(422, f"{label}: el archivo esta vacio")
    if size > max_size:
        raise HTTPException(
            413,
            f"{label}: supera el maximo de {max_size // (1024 * 1024)} MB",
        )
    return extension


def validate_video_file(file: UploadFile) -> str:
    return _validate(file, ALLOWED_VIDEO_EXTENSIONS, VIDEO_CONTENT_TYPES, MAX_VIDEO_SIZE_BYTES, "Video")


def validate_thumbnail_file(file: UploadFile) -> str:
    return _validate(
        file, ALLOWED_THUMBNAIL_EXTENSIONS, THUMBNAIL_CONTENT_TYPES, MAX_THUMBNAIL_SIZE_BYTES, "Miniatura"
    )


def upload_file_to_s3_or_local(file: UploadFile, bucket_name: str, folder_type: str, extension: str) -> str:
    """Sube a S3 si hay bucket configurado; si no, guarda en disco (solo desarrollo local)."""
    filename = f"{uuid.uuid4().hex}{extension}"

    if bucket_name:
        try:
            get_s3_client().upload_fileobj(
                file.file, bucket_name, filename, ExtraArgs={"ContentType": file.content_type}
            )
        except (BotoCoreError, ClientError) as error:
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"No se pudo subir el archivo a S3: {error}") from error
        return f"https://{bucket_name}.s3.{AWS_REGION}.amazonaws.com/{filename}"

    destination = UPLOADS_DIR / folder_type
    destination.mkdir(parents=True, exist_ok=True)
    with open(destination / filename, "wb") as out:
        out.write(file.file.read())
    return f"{LOCAL_PREFIX}{folder_type}/{filename}"


def upload_video(file: UploadFile) -> str:
    return upload_file_to_s3_or_local(file, S3_BUCKET_VIDEOS, "videos", validate_video_file(file))


def upload_thumbnail(file: UploadFile) -> str:
    return upload_file_to_s3_or_local(file, S3_BUCKET_THUMBNAILS, "thumbnails", validate_thumbnail_file(file))


def upload_video_and_thumbnail(video_file: UploadFile, thumbnail_file: UploadFile) -> Tuple[str, str]:
    # Se validan ambos antes de subir para no dejar archivos huerfanos
    validate_video_file(video_file)
    validate_thumbnail_file(thumbnail_file)

    video_url = upload_video(video_file)
    try:
        thumbnail_url = upload_thumbnail(thumbnail_file)
    except Exception:
        delete_file_from_s3_or_local(video_url)
        raise
    return video_url, thumbnail_url


def delete_file_from_s3_or_local(file_url: str) -> None:
    """Borra el archivo de S3 o del disco local segun de donde venga la URL."""
    if file_url.startswith(LOCAL_PREFIX):
        target = (UPLOADS_DIR / file_url[len(LOCAL_PREFIX):]).resolve()
        if UPLOADS_DIR.resolve() in target.parents and target.is_file():
            target.unlink()
        return

    parsed = urlparse(file_url)
    bucket = parsed.netloc.split(".s3.")[0]
    key = parsed.path.lstrip("/")
    if key and bucket in (S3_BUCKET_VIDEOS, S3_BUCKET_THUMBNAILS):
        try:
            get_s3_client().delete_object(Bucket=bucket, Key=key)
        except (BotoCoreError, ClientError) as error:
            print(f"[S3] No se pudo borrar {file_url}: {error}")
