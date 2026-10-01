"""Abstraccion de almacenamiento: disco local (desarrollo) o Amazon S3 (produccion)."""
import uuid
from pathlib import PurePosixPath
from typing import BinaryIO, Protocol

from core.config import settings

VIDEOS = "videos"
THUMBNAILS = "thumbnails"


class Storage(Protocol):
    def save(self, kind: str, fileobj: BinaryIO, extension: str, content_type: str) -> str: ...

    def delete(self, url: str) -> None: ...


def new_key(extension: str) -> str:
    return f"{uuid.uuid4().hex}{extension.lower()}"


def get_storage() -> Storage:
    if settings.STORAGE_BACKEND == "s3":
        from services.s3_service import S3Storage

        return S3Storage()
    from services.local_service import LocalStorage

    return LocalStorage()


def extension_of(filename: str) -> str:
    return PurePosixPath(filename or "").suffix.lower()
