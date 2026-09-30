"""Abstraccion de almacenamiento: disco local (desarrollo) o Amazon S3 (produccion)."""
import uuid
from pathlib import PurePosixPath
from typing import BinaryIO, Protocol

from src.core.config import settings

VIDEOS = "videos"
THUMBNAILS = "thumbnails"


class Storage(Protocol):
    def save(self, kind: str, fileobj: BinaryIO, extension: str, content_type: str) -> str: ...

    def delete(self, url: str) -> None: ...


def new_key(extension: str) -> str:
    return f"{uuid.uuid4().hex}{extension.lower()}"


def get_storage() -> Storage:
    if settings.STORAGE_BACKEND == "s3":
        from src.services.s3_storage import S3Storage

        return S3Storage()
    from src.services.local_storage import LocalStorage

    return LocalStorage()


def extension_of(filename: str) -> str:
    return PurePosixPath(filename or "").suffix.lower()
