from typing import BinaryIO
from urllib.parse import urlparse

import boto3

from core.config import settings
from services.storage_service import THUMBNAILS, VIDEOS, new_key


class S3Storage:
    """Usa la cadena de credenciales por defecto de boto3 (IAM Role de la EC2).

    No se escribe ninguna clave de AWS en el codigo.
    """

    def __init__(self) -> None:
        self.client = boto3.client("s3", region_name=settings.AWS_REGION)

    def _bucket(self, kind: str) -> str:
        return settings.S3_VIDEOS_BUCKET if kind == VIDEOS else settings.S3_THUMBS_BUCKET

    def save(self, kind: str, fileobj: BinaryIO, extension: str, content_type: str) -> str:
        bucket = self._bucket(kind)
        key = new_key(extension)
        self.client.upload_fileobj(
            fileobj, bucket, key, ExtraArgs={"ContentType": content_type}
        )
        return f"https://{bucket}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"

    def delete(self, url: str) -> None:
        parsed = urlparse(url)
        bucket = parsed.netloc.split(".s3.")[0]
        key = parsed.path.lstrip("/")
        if bucket in (settings.S3_VIDEOS_BUCKET, settings.S3_THUMBS_BUCKET) and key:
            self.client.delete_object(Bucket=bucket, Key=key)


__all__ = ["S3Storage", "THUMBNAILS", "VIDEOS"]
