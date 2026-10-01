import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # carpeta backend/
load_dotenv(BASE_DIR / ".env")


def _list(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'tubeyou.db'}")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-only-secret-change-me")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "720"))

    CORS_ORIGINS: list[str] = _list(os.getenv("CORS_ORIGINS", "http://localhost:5173"))

    STORAGE_BACKEND: str = os.getenv("STORAGE_BACKEND", "local")
    PUBLIC_BASE_URL: str = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")
    UPLOADS_DIR: Path = Path(os.getenv("UPLOADS_DIR", str(BASE_DIR / "uploads")))

    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    S3_VIDEOS_BUCKET: str = os.getenv("S3_VIDEOS_BUCKET", "")
    S3_THUMBS_BUCKET: str = os.getenv("S3_THUMBS_BUCKET", "")

    MAX_VIDEO_BYTES: int = 100 * 1024 * 1024
    MAX_THUMB_BYTES: int = 5 * 1024 * 1024


settings = Settings()
