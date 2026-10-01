import shutil
from typing import BinaryIO

from src.core.config import settings
from src.services.storage_service import new_key


class LocalStorage:
    def save(self, kind: str, fileobj: BinaryIO, extension: str, content_type: str) -> str:
        folder = settings.UPLOADS_DIR / kind
        folder.mkdir(parents=True, exist_ok=True)
        key = new_key(extension)
        with open(folder / key, "wb") as out:
            shutil.copyfileobj(fileobj, out)
        return f"{settings.PUBLIC_BASE_URL}/uploads/{kind}/{key}"

    def delete(self, url: str) -> None:
        prefix = f"{settings.PUBLIC_BASE_URL}/uploads/"
        if not url.startswith(prefix):
            return
        relative = url[len(prefix):]
        target = (settings.UPLOADS_DIR / relative).resolve()
        if settings.UPLOADS_DIR.resolve() in target.parents and target.is_file():
            target.unlink()
