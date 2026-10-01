from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src import models  # noqa: F401  (registra las tablas en Base.metadata)
from src.core.config import settings
from src.database.database import Base, engine
from src.routers import comment_router, user_router, video_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TubeYou API",
    description="API de la plataforma de videos TubeYou (FastAPI + PostgreSQL + S3).",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router.router)
app.include_router(video_router.router)
app.include_router(comment_router.router)

if settings.STORAGE_BACKEND == "local":
    settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.UPLOADS_DIR), name="uploads")


@app.get("/health", tags=["Sistema"])
def health():
    return {"status": "ok"}
